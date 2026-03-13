<?php

namespace App\Services;

use App\Mail\CourseFinished;
use App\Mail\EnrollmentConfirmed;
use App\Models\Curso;
use App\Models\EstadoCurso;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class CourseService
{
    /**
     * Build the base query for courses with common filters and relationships.
     */
    public function getFilteredCoursesQuery(Request $request, bool $isAdmin = false): Builder
    {
        $query = Curso::query()->with(['habilidad', 'categoria', 'programa', 'proveedor', 'cdc']);

        // Visibility filter: non-admins only see published, non-finished courses
        if (!$isAdmin) {
            $query->where('publicado', 1);
            $query->where(function ($q) {
                $q->whereNull('fin')->orWhere('fin', '>=', now()->startOfDay());
            });
        }

        if ($request->filled('search')) {
            $query->where('nombre', 'like', '%'.$request->search.'%');
        }

        if ($request->filled('habilidad_id') && $request->habilidad_id !== 'null') {
            $query->where('habilidad_id', $request->habilidad_id);
        }

        if ($request->filled('categoria_id') && $request->categoria_id !== 'null') {
            $query->where('categoria_id', $request->categoria_id);
        }

        if ($request->filled('cdc_id') && $request->cdc_id !== 'null') {
            $query->where('id_cdc', $request->cdc_id);
        }

        return $query;
    }
    /**
     * Automatically mark finished courses as "Terminado"
     */
    public function processCourseTransitions()
    {
        $this->handleFinishedCourses();
        $this->handleDelayedConfirmations();
    }

    /**
     * Rule: When curso.fin passes, change 'aceptado' to 'terminado'
     */
    protected function handleFinishedCourses()
    {
        $terminadoName = 'terminado';
        $aceptadoStatusIds = EstadoCurso::where('estado', 'matriculado')->pluck('id')->toArray();

        // Get all enrollments for courses that ended
        $enrollments = DB::table('cursos_users')
            ->join('cursos', 'cursos_users.id_curso', '=', 'cursos.id')
            // [DEV MODE] Removed date restriction for testing
            // ->where('cursos.fin', '<', Carbon::now()->toDateString())
            ->whereIn('cursos_users.curso_estado', $aceptadoStatusIds)
            ->select('cursos_users.id', 'cursos_users.id_user', 'cursos_users.id_curso')
            ->get();

        foreach ($enrollments as $enrollment) {
            $user = User::find($enrollment->id_user);
            $curso = Curso::find($enrollment->id_curso);

            // Create tracking state
            $newState = EstadoCurso::create([
                'estado' => $terminadoName,
            ]);

            DB::table('cursos_users')
                ->where('id', $enrollment->id)
                ->update(['curso_estado' => $newState->id, 'updated_at' => now()]);

            // Notification: Congratulations on finishing
            Mail::to($user->email)->send(new CourseFinished($user, $curso));
        }
    }

    /**
     * Rule: Send "Matriculado" email 6 days before course start if status is 'aceptado'
     */
    protected function handleDelayedConfirmations()
    {
        $aceptadoStatusIds = EstadoCurso::where('estado', 'matriculado')->pluck('id')->toArray();
        $targetDate = Carbon::now()->addDays(6)->toDateString();

        // Find enrollments for courses starting in exactly 6 days
        $enrollments = DB::table('cursos_users')
            ->join('cursos', 'cursos_users.id_curso', '=', 'cursos.id')
            // [DEV MODE] Removed 6-day restriction for testing
            // ->where('cursos.inicio', '=', $targetDate)
            ->whereIn('cursos_users.curso_estado', $aceptadoStatusIds)
            ->select('cursos_users.id_user', 'cursos_users.id_curso')
            ->get();

        foreach ($enrollments as $enrollment) {
            $user = User::find($enrollment->id_user);
            $curso = Curso::find($enrollment->id_curso);

            // Send Congratulations email
            Mail::to($user->email)->send(new EnrollmentConfirmed($user, $curso));
        }
    }
}
