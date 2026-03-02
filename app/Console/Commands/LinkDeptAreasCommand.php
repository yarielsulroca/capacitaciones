<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Departamento;
use App\Models\Area;

class LinkDeptAreasCommand extends Command
{
    protected $signature = 'app:link-dept-areas';
    protected $description = 'Show departamentos and their area linkage, prompting to fix orphans';

    public function handle()
    {
        $depts = Departamento::with('area')->orderBy('nombre')->get();

        $this->info("=== Departamentos ===");
        $orphans = [];
        foreach ($depts as $d) {
            $areaName = $d->area ? $d->area->nombre : 'SIN AREA';
            $mark = $d->area ? '✓' : '✗';
            $this->line("  {$mark} #{$d->id} {$d->nombre} => {$areaName}");
            if (!$d->area) {
                $orphans[] = $d;
            }
        }

        $this->info("\nTotal: {$depts->count()} departamentos, " . count($orphans) . " sin area");

        if (count($orphans) === 0) {
            $this->info("All departamentos have areas assigned!");
            return Command::SUCCESS;
        }

        // Try to auto-assign based on user data
        $this->info("\n=== Auto-assigning areas from user data ===");
        foreach ($orphans as $dept) {
            $mostCommonAreaId = \App\Models\User::where('id_departamento', $dept->id)
                ->whereNotNull('id_area')
                ->select('id_area')
                ->groupBy('id_area')
                ->orderByRaw('COUNT(*) DESC')
                ->value('id_area');

            if ($mostCommonAreaId) {
                $area = Area::find($mostCommonAreaId);
                $dept->update(['id_area' => $mostCommonAreaId]);
                $this->line("  ✓ {$dept->nombre} => {$area->nombre} (from user data)");
            } else {
                $this->warn("  ✗ {$dept->nombre} => No users with area found, cannot auto-assign");
            }
        }

        // Show final state
        $this->info("\n=== Final State ===");
        $stillOrphans = Departamento::whereNull('id_area')->count();
        $this->info("Departamentos without area: {$stillOrphans}");

        return Command::SUCCESS;
    }
}
