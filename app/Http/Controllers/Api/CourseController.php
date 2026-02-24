<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CursoResource;
use App\Models\Curso;
use App\Services\CourseService;
use App\Services\EnrollmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CourseController extends Controller
{
    public function __construct(
        protected CourseService $courseService,
        protected EnrollmentService $enrollmentService
    ) {}

    /**
     * Display a listing of courses with filters.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Curso::query()->with(['habilidad', 'categoria']);

        if ($request->has('habilidad_id')) {
            $query->where('habilidad_id', $request->habilidad_id);
        }

        $courses = $query->latest()->paginate($request->get('limit', 15));

        return response()->json(CursoResource::collection($courses));
    }

    /**
     * Display the specified course.
     */
    public function show(Request $request, Curso $curso): JsonResponse
    {
        $curso->load(['habilidad', 'categoria']);

        return response()->json(new CursoResource($curso));
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
     * Enroll in a course (for API usage)
     */
    public function enroll(Request $request, Curso $curso): JsonResponse
    {
        try {
            $this->enrollmentService->enroll($request->user(), $curso);

            return response()->json(['message' => 'Solicitud enviada con éxito.']);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * Cancel enrollment (for API usage)
     */
    public function cancel(Request $request, Curso $curso): JsonResponse
    {
        try {
            $this->enrollmentService->updateState(
                $request->user(),
                $curso,
                'cancelado',
                $request->user()
            );

            return response()->json(['message' => 'Matrícula cancelada.']);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }
}
