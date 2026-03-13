<?php

namespace App\Console\Commands;

use App\Models\Area;
use App\Models\Cdc;
use App\Models\Departamento;
use App\Models\Empresa;
use App\Models\Presupuesto;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use PhpOffice\PhpSpreadsheet\IOFactory;

class FreshImportFromExcel extends Command
{
    protected $signature = 'import:fresh
                            {file : Path to the XLSX file}
                            {--apply : Apply changes (default is dry-run)}';

    protected $description = 'Fresh import: wipe areas/depts/empresas and recreate from Excel. Preserves cursos/presupuestos and re-links them.';

    public function handle(): int
    {
        $file = $this->argument('file');
        $dryRun = !$this->option('apply');

        if (!file_exists($file)) {
            $this->error("File not found: $file");
            return self::FAILURE;
        }

        if ($dryRun) {
            $this->info('🔍 DRY-RUN MODE — no changes will be made.');
        } else {
            $this->warn('⚠️  APPLY MODE — changes WILL be written to the database.');
            if (!$this->confirm('This will DELETE all areas, departments, and empresas and recreate them. Continue?')) {
                return self::SUCCESS;
            }
        }

        // ── Read Excel ──
        $this->newLine();
        $this->info('Reading Excel...');
        $reader = IOFactory::createReaderForFile($file);
        $reader->setReadDataOnly(true);
        $rows = $reader->load($file)->getActiveSheet()->toArray();
        array_shift($rows);

        // ── Parse unique values ──
        $excelAreas = [];     // areaNombre => [deptName => true]
        $excelDepts = [];     // deptNombre => areaNombre
        $excelEmpresas = [];  // empNombre => true
        $excelUsers = [];     // email => {nombre, cargo, deptNombre, areaNombre, empNombre, jefeName}

        foreach ($rows as $row) {
            $email      = strtolower(trim($row[0] ?? ''));
            $nombre     = trim($row[1] ?? '');
            $cargo      = trim($row[2] ?? '');
            $deptNombre = trim($row[3] ?? '');
            $areaNombre = trim($row[4] ?? '');
            $empNombre  = trim($row[5] ?? '');
            $jefeName   = trim($row[6] ?? '');

            if (!$email || !$nombre) continue;

            if ($areaNombre) $excelAreas[$areaNombre] = $excelAreas[$areaNombre] ?? [];
            if ($deptNombre && $areaNombre) {
                $excelAreas[$areaNombre][$deptNombre] = true;
                $excelDepts[$deptNombre] = $areaNombre;
            }
            if ($empNombre) $excelEmpresas[$empNombre] = true;
            $excelUsers[$email] = compact('nombre', 'cargo', 'deptNombre', 'areaNombre', 'empNombre', 'jefeName');
        }

        $this->line("  Areas: " . count($excelAreas) . " | Depts: " . count($excelDepts)
            . " | Empresas: " . count($excelEmpresas) . " | Users: " . count($excelUsers));

        // ── Save old mappings BEFORE deletion ──
        $this->newLine();
        $this->info('Saving old mappings...');

        // oldDeptId → nombre (including soft-deleted)
        $oldDeptIdToName = DB::table('departamentos')->pluck('nombre', 'id')->toArray();

        // presupuesto.id → old dept name
        $presDeptMap = [];
        foreach (Presupuesto::all() as $p) {
            if ($p->id_departamento && isset($oldDeptIdToName[$p->id_departamento])) {
                $presDeptMap[$p->id] = $oldDeptIdToName[$p->id_departamento];
            }
        }

        // cdc.id → old dept name
        $cdcDeptMap = [];
        foreach (Cdc::all() as $c) {
            if ($c->id_departamento && isset($oldDeptIdToName[$c->id_departamento])) {
                $cdcDeptMap[$c->id] = $oldDeptIdToName[$c->id_departamento];
            }
        }

        // cdc_curso rows → old dept name
        $cdcCursoRows = DB::table('cdc_curso')->whereNotNull('id_departamento')->get();
        $cdcCursoDeptMap = [];
        foreach ($cdcCursoRows as $row) {
            if (isset($oldDeptIdToName[$row->id_departamento])) {
                $cdcCursoDeptMap[] = ['id' => $row->id ?? null, 'curso_id' => $row->curso_id, 'cdc_id' => $row->cdc_id, 'deptName' => $oldDeptIdToName[$row->id_departamento]];
            }
        }

        $this->line("  Presupuestos to re-link: " . count($presDeptMap));
        $this->line("  CDCs to re-link: " . count($cdcDeptMap));
        $this->line("  cdc_curso rows to re-link: " . count($cdcCursoDeptMap));

        if ($dryRun) {
            $this->showDryRunSummary($excelAreas, $excelDepts, $excelEmpresas, $excelUsers);
            return self::SUCCESS;
        }

        // ══════════════════════════════════════════════
        // APPLY
        // ══════════════════════════════════════════════

        // ── Phase 1: Nullify all FK references ──
        $this->newLine();
        $this->info('━━━ Phase 1: Nullify FK references ━━━');
        DB::statement('UPDATE users SET id_departamento = NULL, id_area = NULL, id_empresa = NULL, id_jefe = NULL WHERE deleted_at IS NULL OR deleted_at IS NOT NULL');
        $this->line('  ✓ Users nullified');
        DB::statement('UPDATE presupuestos SET id_departamento = NULL');
        $this->line('  ✓ Presupuestos nullified');
        DB::statement('UPDATE cdcs SET id_departamento = NULL');
        $this->line('  ✓ CDCs nullified');
        DB::statement('UPDATE cdc_curso SET id_departamento = NULL');
        $this->line('  ✓ cdc_curso nullified');

        // ── Phase 2: Delete old data ──
        $this->newLine();
        $this->info('━━━ Phase 2: Delete old data ━━━');
        DB::statement('DELETE FROM departamentos');
        $this->line('  🗑 Departamentos deleted');
        DB::statement('DELETE FROM areas');
        $this->line('  🗑 Areas deleted');
        DB::statement('DELETE FROM empresas');
        $this->line('  🗑 Empresas deleted');

        // ── Phase 3: Create Areas ──
        $this->newLine();
        $this->info('━━━ Phase 3: Create Areas ━━━');
        $newAreaMap = [];
        foreach (array_keys($excelAreas) as $areaNombre) {
            $area = Area::create(['nombre' => $areaNombre]);
            $newAreaMap[$areaNombre] = $area->id;
            $this->line("  ✓ #{$area->id} {$areaNombre}");
        }

        // ── Phase 4: Create Departamentos ──
        $this->newLine();
        $this->info('━━━ Phase 4: Create Departamentos ━━━');
        $newDeptMap = [];
        foreach ($excelDepts as $deptNombre => $areaNombre) {
            $dept = Departamento::create([
                'nombre' => $deptNombre,
                'id_area' => $newAreaMap[$areaNombre] ?? null,
            ]);
            $newDeptMap[$deptNombre] = $dept->id;
            $this->line("  ✓ #{$dept->id} {$deptNombre} → {$areaNombre}");
        }

        // ── Phase 5: Create Empresas ──
        $this->newLine();
        $this->info('━━━ Phase 5: Create Empresas ━━━');
        $newEmpMap = [];
        foreach (array_keys($excelEmpresas) as $empNombre) {
            $emp = Empresa::create(['nombre' => $empNombre]);
            $newEmpMap[$empNombre] = $emp->id;
            $this->line("  ✓ #{$emp->id} {$empNombre}");
        }

        // ── Phase 6: Update/Create Users ──
        $this->newLine();
        $this->info('━━━ Phase 6: Update/Create Users ━━━');
        $updated = 0; $created = 0;

        foreach ($excelUsers as $email => $data) {
            $userData = [
                'name'             => $data['nombre'],
                'cargo'            => $data['cargo'] ?: null,
                'id_departamento'  => $newDeptMap[$data['deptNombre']] ?? null,
                'id_area'          => $newAreaMap[$data['areaNombre']] ?? null,
                'id_empresa'       => $newEmpMap[$data['empNombre']] ?? null,
            ];

            $user = User::withTrashed()->where('email', $email)->first();
            if ($user) {
                $user->update($userData);
                if ($user->trashed()) $user->restore();
                $updated++;
            } else {
                User::create(array_merge($userData, [
                    'email' => $email, 'password' => null, 'role' => 'user',
                ]));
                $created++;
            }
        }
        $this->line("  Updated: {$updated}, Created: {$created}");

        // ── Phase 7: Resolve Jefes ──
        $this->newLine();
        $this->info('━━━ Phase 7: Resolve Jefes ━━━');
        $jefesOk = 0; $jefesFail = 0;
        foreach ($excelUsers as $email => $data) {
            if (!$data['jefeName'] || $data['jefeName'] === '--') continue;
            $jefe = User::whereRaw('UPPER(name) = ?', [strtoupper($data['jefeName'])])->first();
            if ($jefe) {
                User::where('email', $email)->update(['id_jefe' => $jefe->id]);
                $jefesOk++;
            } else {
                $jefesFail++;
            }
        }
        $this->line("  Resolved: {$jefesOk}, Not found: {$jefesFail}");

        // ── Phase 8: Re-link Presupuestos ──
        $this->newLine();
        $this->info('━━━ Phase 8: Re-link Presupuestos ━━━');
        $presFixed = 0; $presOrphaned = 0;
        foreach ($presDeptMap as $presId => $oldDeptName) {
            $newDeptId = $this->findNewDeptId($oldDeptName, $newDeptMap);
            if ($newDeptId) {
                Presupuesto::where('id', $presId)->update(['id_departamento' => $newDeptId]);
                $presFixed++;
            } else {
                $presOrphaned++;
                $this->line("  ✗ Presupuesto #{$presId}: dept \"{$oldDeptName}\" not found");
            }
        }
        $this->line("  Re-linked: {$presFixed}, Orphaned: {$presOrphaned}");

        // ── Phase 9: Re-link CDCs ──
        $this->newLine();
        $this->info('━━━ Phase 9: Re-link CDCs ━━━');
        $cdcFixed = 0; $cdcOrphaned = 0;
        foreach ($cdcDeptMap as $cdcId => $oldDeptName) {
            $newDeptId = $this->findNewDeptId($oldDeptName, $newDeptMap);
            if ($newDeptId) {
                Cdc::where('id', $cdcId)->update(['id_departamento' => $newDeptId]);
                $cdcFixed++;
            } else {
                $cdcOrphaned++;
                $this->line("  ✗ CDC #{$cdcId}: dept \"{$oldDeptName}\" not found");
            }
        }
        $this->line("  Re-linked: {$cdcFixed}, Orphaned: {$cdcOrphaned}");

        // ── Phase 10: Re-link cdc_curso ──
        $this->newLine();
        $this->info('━━━ Phase 10: Re-link cdc_curso ━━━');
        $ccFixed = 0;
        foreach ($cdcCursoDeptMap as $entry) {
            $newDeptId = $this->findNewDeptId($entry['deptName'], $newDeptMap);
            if ($newDeptId) {
                DB::table('cdc_curso')
                    ->where('curso_id', $entry['curso_id'])
                    ->where('cdc_id', $entry['cdc_id'])
                    ->update(['id_departamento' => $newDeptId]);
                $ccFixed++;
            }
        }
        $this->line("  Re-linked: {$ccFixed}");

        // ── Final State ──
        $this->newLine();
        $this->info('━━━ Final State ━━━');
        foreach (Area::all() as $a) {
            $uc = User::where('id_area', $a->id)->count();
            $dc = Departamento::where('id_area', $a->id)->count();
            $this->line("  #{$a->id} {$a->nombre}: {$uc} users, {$dc} depts");
        }

        $this->newLine();
        $this->info('✅ Fresh import completed!');
        return self::SUCCESS;
    }

    /**
     * Find new department ID by name (case-insensitive match).
     */
    private function findNewDeptId(string $oldName, array $newDeptMap): ?int
    {
        foreach ($newDeptMap as $name => $id) {
            if (strcasecmp($oldName, $name) === 0) return $id;
        }
        return null;
    }

    private function showDryRunSummary(array $areas, array $depts, array $empresas, array $users): void
    {
        $this->newLine();
        $this->info('━━━ DRY-RUN SUMMARY ━━━');

        $this->newLine();
        $this->info('Areas (' . count($areas) . '):');
        foreach ($areas as $name => $deptList) {
            $this->line("  📁 {$name} (" . count($deptList) . " depts)");
        }

        $this->info('Departamentos (' . count($depts) . '):');
        foreach ($depts as $dName => $aName) {
            $this->line("  📂 {$dName} → {$aName}");
        }

        $this->info('Empresas (' . count($empresas) . '):');
        foreach (array_keys($empresas) as $n) {
            $this->line("  🏢 {$n}");
        }

        $existingUsers = User::whereIn('email', array_map('strtolower', array_keys($users)))->count();
        $this->newLine();
        $this->table(['Action', 'Count'], [
            ['Users to update', $existingUsers],
            ['Users to create', count($users) - $existingUsers],
        ]);

        $this->newLine();
        $this->warn('No changes made. Run with --apply to execute.');
    }
}
