<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Http\Resources\CursoResource;
use App\Models\Categoria;
use App\Models\Cdc;
use App\Models\Curso;
use App\Models\EstadoCurso;
use App\Models\Habilidad;
use App\Services\EnrollmentService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CourseController extends Controller
{
    public function __construct(
        protected EnrollmentService $enrollmentService,
        protected \App\Services\CourseService $courseService
    ) {}

    public function index(Request $request)
    {
        $user = $request->user();
        $is_admin = $user->role === 'admin';
        $is_lider = $user->role === 'lider' || \App\Models\User::where('id_jefe', $user->id)->exists();

        $query = $this->courseService->getFilteredCoursesQuery($request, $is_admin);

        if ($is_lider && !$is_admin) {
            $teamMemberIds = \App\Models\User::where('id_jefe', $user->id)->pluck('id');
            // Show course if a team member is enrolled
            $query->whereHas('users', function($q) use ($teamMemberIds) {
                $q->whereIn('cursos_users.id_user', $teamMemberIds);
            });
        }

        $courses = $query->latest()->paginate($request->get('limit', 15));

        return Inertia::render('colaborador/courses/index', [
            'courses' => CursoResource::collection($courses),
            'filters' => $request->all(['search', 'habilidad_id', 'cdc_id', 'categoria_id']),
            'metadata' => [
                'habilidades' => Habilidad::all(),
                'categorias' => Categoria::all(),
                'cdcs' => Cdc::all(),
                'programas' => \App\Models\ProgramaAsociado::where('activo', 1)->get(),
            ],
            'stats' => [
                'total_cursos' => Curso::count(),
                'total_habilidades' => Habilidad::count(),
                'total_categorias' => Categoria::count(),
                'total_programas' => \App\Models\ProgramaAsociado::count(),
            ],
            'is_admin' => $is_admin,
            'is_lider' => $is_lider,
        ]);
    }

    public function show(Request $request, Curso $curso)
    {
        // Visibility check
        if ($request->user()->role !== 'admin' && !$curso->publicado) {
            abort(404);
        }

        $curso->load(['habilidad', 'categoria']);

        $enrollment = $request->user()?->cursos()->where('id_curso', $curso->id)->first();
        $status = null;
        if ($enrollment) {
            $status = EstadoCurso::find($enrollment->pivot->curso_estado)?->estado;
        }

        return Inertia::render('colaborador/courses/show', [
            'curso' => new CursoResource($curso),
            'status' => $status,
        ]);
    }

    public function enroll(Request $request, Curso $curso)
    {
        try {
            $this->enrollmentService->enroll($request->user(), $curso);

            return back()->with('success', 'Solicitud enviada con éxito.');
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

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
