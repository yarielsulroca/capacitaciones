<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Area;
use App\Models\Departamento;
use App\Models\User;

class CleanAreasCommand extends Command
{
    protected $signature = 'app:clean-areas';
    protected $description = 'Clean areas and departments tables - keep only valid organizational data';

    public function handle()
    {
        $this->info('=== Cleaning Areas Table ===');

        // Valid areas from organizational structure
        $validAreas = [
            'ADMINISTRATIVO',
            'ALIMENTOS',
            'CALIDAD',
            'COMERCIAL',
            "DIRECCI\u{00D3}N T\u{00C9}CNICA",
            'FINANCIERO',
            'OPERACIONES',
            'PRESIDENCIA',
            'PRODUCCION',
        ];

        // Create valid areas if they don't exist
        foreach ($validAreas as $name) {
            Area::firstOrCreate(['nombre' => $name]);
            $this->line("  ✓ Area: {$name}");
        }

        // Delete invalid areas (not in whitelist)
        $allAreas = Area::all();
        $invalidCount = 0;
        foreach ($allAreas as $area) {
            $normalized = mb_strtoupper(trim($area->nombre));
            $isValid = false;
            foreach ($validAreas as $va) {
                if (mb_strtoupper($va) === $normalized) {
                    $isValid = true;
                    break;
                }
            }
            if (!$isValid) {
                // Null out references
                User::where('id_area', $area->id)->update(['id_area' => null]);
                Departamento::where('id_area', $area->id)->update(['id_area' => null]);
                $area->forceDelete();
                $this->warn("  ✗ Deleted invalid area: {$area->nombre}");
                $invalidCount++;
            }
        }

        $this->info("Removed {$invalidCount} invalid areas.");

        // Clean Ticket departamentos
        $this->info('');
        $this->info('=== Cleaning Departamentos Table ===');
        $ticketDepts = Departamento::where('nombre', 'like', '%Ticket%')->get();
        foreach ($ticketDepts as $dept) {
            User::where('id_departamento', $dept->id)->update(['id_departamento' => null]);
            $dept->forceDelete();
            $this->warn("  ✗ Deleted: {$dept->nombre}");
        }
        $this->info("Removed {$ticketDepts->count()} Ticket departamentos.");

        // Show final state
        $this->info('');
        $this->info('=== Final State ===');
        $this->info("Areas: " . Area::count());
        foreach (Area::orderBy('nombre')->get() as $a) {
            $this->line("  #{$a->id} - {$a->nombre}");
        }
        $this->info("Departamentos: " . Departamento::count());

        return Command::SUCCESS;
    }
}
