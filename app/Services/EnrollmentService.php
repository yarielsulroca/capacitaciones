<?php

namespace App\Services;

use App\Models\Curso;
use App\Models\User;
use App\Models\EstadoCurso;
use App\Mail\EnrollmentRequested;
use App\Mail\EnrollmentCancelled;
use App\Mail\StatusUpdated;
use Carbon\Carbon;
use Illuminate\Support\Facades\Mail;

class EnrollmentService
{
    /**
     * Apply for a course.
     */
    public function enroll(User $user, Curso $curso)
    {
        $estado = EstadoCurso::where('estado', 'solicitado')->firstOrFail();

        $user->cursos()->attach($curso->id, [
            'curso_estado' => $estado->id,
            'id_user_mod' => $user->id, // User themselves requested it
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Send intermediate email (Solicitado / Procesando)
        Mail::to($user->email)->send(new EnrollmentRequested($user, $curso));
    }

    /**
     * Change state of an enrollment (Used by Admin/Boss)
     */
    public function updateState(User $user, Curso $curso, string $newStateName, User $modifier)
    {
        $enrollment = $user->cursos()->where('id_curso', $curso->id)->withPivot('curso_estado')->first();
        if (!$enrollment) throw new \Exception("Matrícula no encontrada.");

        $currentState = EstadoCurso::find($enrollment->pivot?->curso_estado);

        // Core Transition Rule: 7-day rule for cancellation by bosses
        if ($newStateName === 'cancelado' && ($modifier->id !== $user->id)) {
            // [DEV MODE] Commented for testing
            /*
            if (Carbon::now()->diffInDays($curso->inicio, false) < 7) {
                throw new \Exception("El responsable solo puede cancelar hasta 7 días antes del inicio del curso.");
            }
            */
        }

        // Logic for "Incompleto" if matriculado user cancels themselves
        if ($newStateName === 'cancelado' && $modifier->id === $user->id && $currentState?->estado === 'matriculado') {
            $newStateName = 'incompleto';
        }

        $newState = EstadoCurso::where('estado', $newStateName)->firstOrFail();

        $user->cursos()->updateExistingPivot($curso->id, [
            'curso_estado' => $newState->id,
            'id_user_mod' => $modifier->id,
            'updated_at' => now(),
        ]);

        // Immediate Notifications for certain states
        if (in_array($newStateName, ['cancelado', 'incompleto'])) {
            Mail::to($user->email)->send(new \App\Mail\EnrollmentCancelled($user, $curso));
        } elseif ($newStateName === 'matriculado') {
            Mail::to($user->email)->send(new \App\Mail\EnrollmentConfirmed($user, $curso));
        } elseif ($newStateName === 'certificado') {
            Mail::to($user->email)->send(new \App\Mail\StatusUpdated($user, $curso, $newStateName));
        }
    }
}
