<?php

namespace App\Console\Commands;

use App\Models\Curso;
use App\Models\EstadoCurso;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class AutoTerminateCourses extends Command
{
    protected $signature = 'courses:auto-terminate';
    protected $description = 'Automatically set enrollments to "terminado" when the course end date has passed';

    public function handle()
    {
        $terminadoId = EstadoCurso::where('estado', 'terminado')->value('id');
        $matriculadoId = EstadoCurso::where('estado', 'matriculado')->value('id');

        if (!$terminadoId || !$matriculadoId) {
            $this->error('Could not find terminado or matriculado estado in the database.');
            return 1;
        }

        // Find courses that have ended (fin < today)
        $endedCursos = Curso::whereNotNull('fin')
            ->where('fin', '<', Carbon::today())
            ->pluck('id');

        if ($endedCursos->isEmpty()) {
            $this->info('No ended courses found.');
            return 0;
        }

        // Update all matriculado enrollments for ended courses → terminado
        $updated = DB::table('cursos_users')
            ->whereIn('id_curso', $endedCursos)
            ->where('curso_estado', $matriculadoId)
            ->update([
                'curso_estado' => $terminadoId,
                'updated_at' => now(),
            ]);

        $this->info("Updated {$updated} enrollments to 'terminado' for {$endedCursos->count()} ended courses.");

        return 0;
    }
}
