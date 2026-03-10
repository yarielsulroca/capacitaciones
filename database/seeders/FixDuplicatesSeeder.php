<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Area;
use App\Models\Departamento;
use App\Models\User;
use App\Models\Cdc;
use App\Models\Presupuesto;
use Illuminate\Support\Facades\DB;

class FixDuplicatesSeeder extends Seeder
{
    public function run()
    {
        $this->command->info("--- FIXING AREAS BY LDAP/USERS TRUTH ---");

        // The user suggested using the 'users' table as the source of truth for areas/departments.
        // Let's first clean up duplicate Departments.

        // Let's group all departments by their exact trimmed name.
        $departments = Departamento::all()->groupBy(function($dept) {
            return trim(strtolower($dept->nombre));
        });

        $deptsFixed = 0;
        foreach ($departments as $name => $group) {
            if ($group->count() > 1) {
                // Find a canonical department. Prefer one that has an area assigned.
                $canonical = $group->whereNotNull('id_area')->first() ?? $group->first();
                $duplicates = $group->where('id', '!=', $canonical->id);

                $this->command->info("Found duplicate department: '{$canonical->nombre}' (Keeping ID: {$canonical->id})");

                foreach ($duplicates as $dup) {
                    $this->command->line("  Merging Dept ID {$dup->id} into {$canonical->id}");

                    // Update Users
                    User::where('id_departamento', $dup->id)->update(['id_departamento' => $canonical->id]);

                    // Update CDCs
                    Cdc::where('id_departamento', $dup->id)->update(['id_departamento' => $canonical->id]);

                    // Update Presupuestos
                    Presupuesto::where('id_departamento', $dup->id)->update(['id_departamento' => $canonical->id]);

                    // Delete duplicate department
                    DB::table('departamentos')->where('id', $dup->id)->delete();
                    $deptsFixed++;
                }
            }
        }
        $this->command->info("Departments merged: $deptsFixed\n");

        $this->command->info("--- FIXING ORPHANED DEPARTMENTS' ROOTS ---");
        // Re-link departments to their area based on what the Users table says (LDAP sync)
        $allDepts = Departamento::all();
        $areasFixed = 0;

        foreach ($allDepts as $dept) {
            // Find the most common area mapping for this department from the users table
            $mostCommonAreaId = User::where('id_departamento', $dept->id)
                ->whereNotNull('id_area')
                ->select('id_area')
                ->groupBy('id_area')
                ->orderByRaw('COUNT(*) DESC')
                ->value('id_area');

            if ($mostCommonAreaId && $dept->id_area != $mostCommonAreaId) {
                $dept->update(['id_area' => $mostCommonAreaId]);
                $this->command->line("  Re-linked Dept '{$dept->nombre}' to Area ID {$mostCommonAreaId}");
                $areasFixed++;
            }
        }

        $this->command->info("Departments re-linked to correct Areas: $areasFixed\n");

        $this->command->info("--- DEDUPLICATING PRExSUPUESTOS ---");
        // Because of the duplicate departments, there might be duplicate budgets in the same group.
        // Let's merge budgets in the SAME group for the SAME department.
        $presupuestos = Presupuesto::all()->groupBy(function($p) {
            return $p->id_grupo . '-' . $p->id_departamento;
        });

        $budgetsFixed = 0;
        foreach ($presupuestos as $key => $group) {
            if ($group->count() > 1 && strpos($key, '-') !== 0) { // skip if no group
                $canonical = $group->first();
                $duplicates = $group->slice(1);

                foreach ($duplicates as $dup) {
                    $this->command->line("  Merging Budget ID {$dup->id} into {$canonical->id}");
                    $canonical->inicial += $dup->inicial;
                    $canonical->actual += $dup->actual;
                    $canonical->save();

                    DB::table('presupuestos')->where('id', $dup->id)->delete();
                    $budgetsFixed++;
                }
            }
        }
        $this->command->info("Duplicate Budgets merged: $budgetsFixed\n");

        $this->command->info("Done.");
    }
}
