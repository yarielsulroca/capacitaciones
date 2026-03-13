<?php

namespace App\Services;

use App\Mail\EnrollmentRequested;
use App\Models\Curso;
use App\Models\EstadoCurso;
use App\Models\User;
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

        // Send intermediate email (Solicitado / Procesando) ONLY for "Abierto" courses
        if ($curso->tipo && strtolower($curso->tipo->tipo) === 'abierto') {
            Mail::to($user->email)->send(new EnrollmentRequested($user, $curso));
        }
    }

    /**
     * Change state of an enrollment (Used by Admin/Boss)
     */
    public function updateState(User $user, Curso $curso, string $newStateName, User $modifier)
    {
        $enrollment = $user->cursos()->where('id_curso', $curso->id)->withPivot('curso_estado', 'id_presupuesto')->first();
        if (! $enrollment) {
            throw new \Exception('Matrícula no encontrada.');
        }

        $currentState = EstadoCurso::find($enrollment->pivot?->curso_estado);
        $currentStateName = $currentState?->estado;

        // Core Transition Rule: 7-day rule for cancellation by bosses
        if ($newStateName === 'cancelado' && ($modifier->id !== $user->id)) {
            // [DEV MODE] Commented for testing
            /*
            if (Carbon::now()->diffInDays($curso->inicio, false) < 7) {
                throw new \Exception("El responsable solo puede cancelar hasta 7 días antes del inicio del curso.");
            }
            */
        }

        // Block: once inscripto, the user cannot cancel themselves — only admin can
        if ($newStateName === 'cancelado' && $modifier->id === $user->id && $currentStateName === 'matriculado') {
            throw new \Exception('Una vez inscripto, solo el administrador puede cancelar tu participación.');
        }

        $newState = EstadoCurso::where('estado', $newStateName)->firstOrFail();

        $user->cursos()->updateExistingPivot($curso->id, [
            'curso_estado' => $newState->id,
            'id_user_mod' => $modifier->id,
            'id_presupuesto' => $curso->id_presupuesto,
            'updated_at' => now(),
        ]);

        // ── Capacity management ──
        // Decrement capacity when enrolling (matriculado)
        if ($newStateName === 'matriculado' && $currentStateName !== 'matriculado') {
            $curso->decrement('capacidad');
        }
        // Restore capacity when leaving matriculado (cancel/incompleto)
        if (in_array($newStateName, ['cancelado', 'incompleto']) && $currentStateName === 'matriculado') {
            $curso->increment('capacidad');
        }

        // ── Email notifications (only for "Abierto" courses) ──
        if ($curso->tipo && strtolower($curso->tipo->tipo) === 'abierto') {
            if ($newStateName === 'solicitado') {
                Mail::to($user->email)->send(new \App\Mail\EnrollmentRequested($user, $curso));
            } elseif ($newStateName === 'incompleto') {
                Mail::to($user->email)->send(new \App\Mail\EnrollmentCancelled($user, $curso));
            } elseif ($newStateName === 'matriculado') {
                Mail::to($user->email)->send(new \App\Mail\EnrollmentConfirmed($user, $curso));
            }
        }
    }

}

