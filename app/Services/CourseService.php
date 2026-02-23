<?php

namespace App\Services;

use App\Models\Curso;
use App\Models\EstadoCurso;
use App\Models\User;
use App\Mail\EnrollmentConfirmed;
use App\Mail\CourseFinished;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class CourseService
{
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
