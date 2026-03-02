<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Area;
use App\Models\Departamento;
use App\Models\User;

class CleanInvalidAreasCommand extends Command
{
    protected $signature = 'app:clean-invalid-areas';
    protected $description = 'Remove invalid areas (Tickt, Ticket, Pedido, KAM, Usuario Para, etc.)';

    public function handle()
    {
        $this->info('=== Current Areas ===');
        foreach (Area::orderBy('nombre')->get() as $a) {
            $this->line("  #{$a->id} {$a->nombre}");
        }

        // Patterns that indicate invalid areas
        // Only keep areas that look like real organizational areas
        $invalidAreas = Area::all()->filter(function ($area) {
            return !preg_match('/^(Gerencia|Presidencia|Vicepresidencia|Direcci)/i', $area->nombre);
        });

        if ($invalidAreas->count() === 0) {
            $this->info('No invalid areas found.');
            return Command::SUCCESS;
        }

        $this->warn("\n=== Removing Invalid Areas ===");
        foreach ($invalidAreas as $area) {
            // Null out references
            $usersAffected = User::where('id_area', $area->id)->count();
            User::where('id_area', $area->id)->update(['id_area' => null]);
            Departamento::where('id_area', $area->id)->update(['id_area' => null]);
            $area->forceDelete();
            $this->line("  ✗ Deleted: {$area->nombre} ({$usersAffected} users affected)");
        }

        $this->info("\n=== Remaining Areas ===");
        foreach (Area::orderBy('nombre')->get() as $a) {
            $deptCount = Departamento::where('id_area', $a->id)->count();
            $userCount = User::where('id_area', $a->id)->count();
            $this->line("  ✓ #{$a->id} {$a->nombre} ({$deptCount} depts, {$userCount} users)");
        }

        return Command::SUCCESS;
    }
}
