<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CursoResource;
use App\Models\Curso;
use App\Services\CourseService;
use App\Services\EnrollmentService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\JsonResponse;

class CourseController extends Controller
{
    public function __construct(
        protected CourseService $courseService,
        protected EnrollmentService $enrollmentService
    ) {}

    /**
     * Display a listing of courses with filters.
     */
    public function index(Request $request)
    {
        $query = Curso::query()->with(['habilidad', 'categoria']);

        if ($request->has('habilidad_id')) {
            $query->where('habilidad_id', $request->habilidad_id);
        }

        $courses = $query->latest()->paginate($request->get('limit', 15));

        if ($request->wantsJson()) {
            return CursoResource::collection($courses);
        }

        return \Inertia\Inertia::render('courses/index', [
            'courses' => CursoResource::collection($courses),
            'habilidades' => \App\Models\Habilidad::all(),
            'cdcs' => \App\Models\Cdc::all(),
            'categorias' => \App\Models\Categoria::all(),
            'filters' => $request->all(['search', 'habilidad_id', 'cdc_id', 'categoria_id']),
        ]);
    }

    /**
     * Display the specified course.
     */
    public function show(Request $request, Curso $curso)
    {
        $curso->load(['habilidad', 'categoria']);

        $enrollment = $request->user()?->cursos()->where('id_curso', $curso->id)->first();
        $status = null;
        if ($enrollment) {
            $status = \App\Models\EstadoCurso::find($enrollment->pivot->curso_estado)?->estado;
        }

        if ($request->wantsJson()) {
            return new CursoResource($curso);
        }

        return \Inertia\Inertia::render('courses/show', [
            'curso' => new CursoResource($curso),
            'status' => $status,
        ]);
    }

    /**
     * Get enrollments for current user
     */
    public function myEnrollments(Request $request): JsonResponse
    {
        $user = $request->user();
        $enrollments = $user->cursos()->with(['habilidad', 'categoria'])->get();

        return response()->json($enrollments);
    }

    /**
     * Enroll in a course
     */
    public function enroll(Request $request, Curso $curso)
    {
        try {
            $this->enrollmentService->enroll($request->user(), $curso);
            return back()->with('success', 'Solicitud enviada con éxito.');
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    /**
     * Cancel enrollment
     */
    public function cancel(Request $request, Curso $curso)
    {
        try {
            $this->enrollmentService->updateState(
                $request->user(),
                $curso,
                'cancelado',
                $request->user()
            );
            return back()->with('success', 'Matrícula cancelada.');
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }
}
