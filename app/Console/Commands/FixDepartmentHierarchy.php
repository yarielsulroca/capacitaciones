<?php

namespace App\Console\Commands;

use App\Models\Area;
use App\Models\Departamento;
use App\Models\User;
use Illuminate\Console\Command;

class FixDepartmentHierarchy extends Command
{
    protected $signature = 'fix:department-hierarchy
                            {--apply : Apply changes (default is dry-run)}
                            {--cleanup : Also remove empty areas/departments}';

    protected $description = 'Propagate id_area through the jefe hierarchy and fix orphaned departments';

    public function handle(): int
    {
        $dryRun = !$this->option('apply');
        $cleanup = $this->option('cleanup');

        if ($dryRun) {
            $this->info('🔍 DRY-RUN MODE — no changes will be made. Use --apply to execute.');
        } else {
            $this->warn('⚠️  APPLY MODE — changes WILL be written to the database.');
        }

        $this->newLine();

        // ──────────────────────────────────────────────────────────
        // STEP 1: Propagate id_area down through jefe chains
        // ──────────────────────────────────────────────────────────
        $this->info('━━━ STEP 1: Propagate id_area via jefe hierarchy ━━━');

        $totalAreaFixes = 0;
        $maxPasses = 10; // Safety limit to avoid infinite loops

        for ($pass = 1; $pass <= $maxPasses; $pass++) {
            // Find users who have no id_area but whose jefe does have one
            $usersToFix = User::whereNull('id_area')
                ->whereNotNull('id_jefe')
                ->whereHas('jefe', fn ($q) => $q->whereNotNull('id_area'))
                ->with('jefe:id,id_area,name')
                ->get();

            if ($usersToFix->isEmpty()) {
                break;
            }

            $this->line("  Pass $pass: {$usersToFix->count()} users to fix");

            foreach ($usersToFix as $user) {
                $jefeArea = $user->jefe->id_area;
                $this->line("    ✓ {$user->name} → inherits area #{$jefeArea} from jefe {$user->jefe->name}");

                if (!$dryRun) {
                    $user->update(['id_area' => $jefeArea]);
                }
                $totalAreaFixes++;
            }

            // In dry-run mode, data doesn't change so break after first pass
            if ($dryRun) break;
        }

        $this->info("  Total users getting id_area from jefe: $totalAreaFixes");
        $this->newLine();

        // ──────────────────────────────────────────────────────────
        // STEP 2: Propagate id_area from users → departamentos
        // ──────────────────────────────────────────────────────────
        $this->info('━━━ STEP 2: Fix departamentos without id_area ━━━');

        $orphanedDepts = Departamento::whereNull('id_area')->get();
        $deptFixes = 0;

        foreach ($orphanedDepts as $dept) {
            // Find the most common id_area among users in this department
            $mostCommonAreaId = User::where('id_departamento', $dept->id)
                ->whereNotNull('id_area')
                ->selectRaw('id_area, COUNT(*) as cnt')
                ->groupBy('id_area')
                ->orderByDesc('cnt')
                ->value('id_area');

            if ($mostCommonAreaId) {
                $areaName = Area::find($mostCommonAreaId)?->nombre ?? "#{$mostCommonAreaId}";
                $this->line("  ✓ Dept \"{$dept->nombre}\" → area \"{$areaName}\"");

                if (!$dryRun) {
                    $dept->update(['id_area' => $mostCommonAreaId]);
                }
                $deptFixes++;
            } else {
                $userCount = User::where('id_departamento', $dept->id)->count();
                $this->line("  ✗ Dept \"{$dept->nombre}\" — no users with area ($userCount users total)");
            }
        }

        $this->info("  Departments fixed: $deptFixes / {$orphanedDepts->count()} orphaned");
        $this->newLine();

        // ──────────────────────────────────────────────────────────
        // STEP 3: Also propagate id_departamento via jefe if user is missing it
        // ──────────────────────────────────────────────────────────
        $this->info('━━━ STEP 3: Propagate id_departamento via jefe hierarchy ━━━');

        $totalDeptFixes = 0;

        for ($pass = 1; $pass <= $maxPasses; $pass++) {
            $usersToFix = User::whereNull('id_departamento')
                ->whereNotNull('id_jefe')
                ->whereHas('jefe', fn ($q) => $q->whereNotNull('id_departamento'))
                ->with('jefe:id,id_departamento,name')
                ->get();

            if ($usersToFix->isEmpty()) {
                break;
            }

            $this->line("  Pass $pass: {$usersToFix->count()} users to fix");

            foreach ($usersToFix as $user) {
                $jefeDept = $user->jefe->id_departamento;
                $this->line("    ✓ {$user->name} → inherits dept #{$jefeDept} from jefe {$user->jefe->name}");

                if (!$dryRun) {
                    $user->update(['id_departamento' => $jefeDept]);
                }
                $totalDeptFixes++;
            }

            // In dry-run mode, data doesn't change so break after first pass
            if ($dryRun) break;
        }

        $this->info("  Total users getting id_departamento from jefe: $totalDeptFixes");
        $this->newLine();

        // ──────────────────────────────────────────────────────────
        // STEP 4: Report / cleanup empty areas & departments
        // ──────────────────────────────────────────────────────────
        $this->info('━━━ STEP 4: Empty areas & departments report ━━━');

        $emptyDepts = Departamento::whereDoesntHave('users')->get();

        $emptyAreas = Area::whereDoesntHave('departamentos', function ($q) {
            $q->whereHas('users');
        })->get();

        $this->table(
            ['Type', 'Count', 'Names (first 10)'],
            [
                ['Empty Departments', $emptyDepts->count(), $emptyDepts->take(10)->pluck('nombre')->implode(', ')],
                ['Empty Areas', $emptyAreas->count(), $emptyAreas->take(10)->pluck('nombre')->implode(', ')],
            ]
        );

        if ($cleanup && !$dryRun) {
            if ($emptyDepts->count() > 0) {
                // Null out CDC and presupuesto references before deleting
                \App\Models\Cdc::whereIn('id_departamento', $emptyDepts->pluck('id'))->update(['id_departamento' => null]);
                \App\Models\Presupuesto::whereIn('id_departamento', $emptyDepts->pluck('id'))->update(['id_departamento' => null]);
                Departamento::whereIn('id', $emptyDepts->pluck('id'))->delete();
                $this->warn("  🗑 Soft-deleted {$emptyDepts->count()} empty departments");
            }

            if ($emptyAreas->count() > 0) {
                // Null out department references before deleting
                Departamento::whereIn('id_area', $emptyAreas->pluck('id'))->update(['id_area' => null]);
                User::whereIn('id_area', $emptyAreas->pluck('id'))->update(['id_area' => null]);
                Area::whereIn('id', $emptyAreas->pluck('id'))->delete();
                $this->warn("  🗑 Soft-deleted {$emptyAreas->count()} empty areas");
            }
        } elseif ($cleanup && $dryRun) {
            $this->line('  (Would clean up the above in --apply mode)');
        }

        // ──────────────────────────────────────────────────────────
        // SUMMARY
        // ──────────────────────────────────────────────────────────
        $this->newLine();
        $this->info('━━━ SUMMARY ━━━');
        $this->table(
            ['Action', 'Count'],
            [
                ['Users: id_area inherited from jefe', $totalAreaFixes],
                ['Users: id_departamento inherited from jefe', $totalDeptFixes],
                ['Departments: id_area backfilled', $deptFixes],
                ['Empty departments found', $emptyDepts->count()],
                ['Empty areas found', $emptyAreas->count()],
            ]
        );

        if ($dryRun) {
            $this->newLine();
            $this->warn('No changes were made. Run with --apply to execute.');
        } else {
            $this->newLine();
            $this->info('✅ All changes applied successfully.');
        }

        return self::SUCCESS;
    }
}
