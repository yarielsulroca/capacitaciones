<?php

namespace App\Console\Commands;

use App\Models\Area;
use App\Models\Departamento;
use App\Models\Empresa;
use App\Models\User;
use Illuminate\Console\Command;
use PhpOffice\PhpSpreadsheet\IOFactory;

class ImportUsersFromExcel extends Command
{
    protected $signature = 'import:users-excel
                            {file : Path to the XLSX file}
                            {--apply : Apply changes (default is dry-run)}';

    protected $description = 'Import/update users from an Excel file (email, name, cargo, departamento, area, empresa, jefe)';

    public function handle(): int
    {
        $file = $this->argument('file');
        $dryRun = !$this->option('apply');

        if (!file_exists($file)) {
            $this->error("File not found: $file");
            return self::FAILURE;
        }

        if ($dryRun) {
            $this->info('🔍 DRY-RUN MODE — no changes will be made. Use --apply to execute.');
        } else {
            $this->warn('⚠️  APPLY MODE — changes WILL be written to the database.');
        }

        $this->newLine();
        $this->info('Reading Excel file...');

        $reader = IOFactory::createReaderForFile($file);
        $reader->setReadDataOnly(true);
        $spreadsheet = $reader->load($file);
        $rows = $spreadsheet->getActiveSheet()->toArray();

        // Remove header row
        $header = array_shift($rows);
        $this->line("  Header: " . json_encode($header, JSON_UNESCAPED_UNICODE));
        $this->line("  Data rows: " . count($rows));
        $this->newLine();

        // Caches
        $deptCache = [];
        $areaCache = [];
        $empresaCache = [];

        // Stats
        $created = 0;
        $updated = 0;
        $skipped = 0;
        $jefeQueue = []; // email => jefe_name

        foreach ($rows as $i => $row) {
            $email      = trim($row[0] ?? '');
            $nombre     = trim($row[1] ?? '');
            $cargo      = trim($row[2] ?? '');
            $deptNombre = trim($row[3] ?? '');
            $areaNombre = trim($row[4] ?? '');
            $empNombre  = trim($row[5] ?? '');
            $jefeName   = trim($row[6] ?? '');

            if (!$email || !$nombre) {
                $skipped++;
                continue;
            }

            // Resolve Area
            $areaId = null;
            if ($areaNombre) {
                if (isset($areaCache[$areaNombre])) {
                    $areaId = $areaCache[$areaNombre];
                } elseif (!$dryRun) {
                    $area = Area::firstOrCreate(['nombre' => $areaNombre]);
                    $areaId = $area->id;
                    $areaCache[$areaNombre] = $areaId;
                } else {
                    $areaId = Area::where('nombre', $areaNombre)->value('id');
                    if (!$areaId) $areaId = "NEW:$areaNombre";
                    $areaCache[$areaNombre] = $areaId;
                }
            }

            // Resolve Departamento
            $deptId = null;
            if ($deptNombre) {
                if (isset($deptCache[$deptNombre])) {
                    $deptId = $deptCache[$deptNombre];
                } elseif (!$dryRun) {
                    $dept = Departamento::firstOrCreate(['nombre' => $deptNombre]);
                    // Link dept to area
                    if ($areaId && is_int($areaId)) {
                        $dept->update(['id_area' => $areaId]);
                    }
                    $deptId = $dept->id;
                    $deptCache[$deptNombre] = $deptId;
                } else {
                    $deptId = Departamento::where('nombre', $deptNombre)->value('id');
                    if (!$deptId) $deptId = "NEW:$deptNombre";
                    $deptCache[$deptNombre] = $deptId;
                }
            }

            // Resolve Empresa
            $empresaId = null;
            if ($empNombre) {
                if (isset($empresaCache[$empNombre])) {
                    $empresaId = $empresaCache[$empNombre];
                } elseif (!$dryRun) {
                    $empresa = Empresa::firstOrCreate(['nombre' => $empNombre]);
                    $empresaId = $empresa->id;
                    $empresaCache[$empNombre] = $empresaId;
                } else {
                    $empresaId = Empresa::where('nombre', $empNombre)->value('id');
                    if (!$empresaId) $empresaId = "NEW:$empNombre";
                    $empresaCache[$empNombre] = $empresaId;
                }
            }

            // Find or create user
            $user = User::where('email', $email)->first();

            $userData = array_filter([
                'name'             => $nombre,
                'cargo'            => $cargo ?: null,
                'id_departamento'  => is_int($deptId) ? $deptId : null,
                'id_area'          => is_int($areaId) ? $areaId : null,
                'id_empresa'       => is_int($empresaId) ? $empresaId : null,
            ], fn($v) => $v !== null);

            if ($user) {
                if (!$dryRun) {
                    $user->update($userData);
                }
                $updated++;
            } else {
                if (!$dryRun) {
                    $user = User::create(array_merge($userData, [
                        'email'    => $email,
                        'password' => null,
                        'role'     => 'user',
                    ]));
                }
                $created++;
            }

            // Queue jefe for second pass
            if ($jefeName) {
                $jefeQueue[$email] = $jefeName;
            }
        }

        $this->info('━━━ Phase 1: Users & Structure ━━━');
        $this->table(['Action', 'Count'], [
            ['Updated', $updated],
            ['Created', $created],
            ['Skipped (empty)', $skipped],
        ]);

        // Show new areas/departments that will be created
        $newAreas = array_filter($areaCache, fn($v) => is_string($v) && str_starts_with($v, 'NEW:'));
        $newDepts = array_filter($deptCache, fn($v) => is_string($v) && str_starts_with($v, 'NEW:'));

        if (!empty($newAreas) || !empty($newDepts)) {
            $this->newLine();
            $this->info('New entities that will be created:');
            foreach ($newAreas as $name => $id) {
                $this->line("  📁 New Area: \"$name\"");
            }
            foreach ($newDepts as $name => $id) {
                $this->line("  📂 New Dept: \"$name\"");
            }
        }

        // Phase 2: Resolve jefes
        $this->newLine();
        $this->info('━━━ Phase 2: Resolving Jefes ━━━');
        $jefesResolved = 0;
        $jefesNotFound = [];

        foreach ($jefeQueue as $userEmail => $jefeName) {
            // Match jefe by name (case insensitive)
            $jefeUser = User::whereRaw('UPPER(name) = ?', [strtoupper($jefeName)])->first();

            if ($jefeUser) {
                if (!$dryRun) {
                    User::where('email', $userEmail)->update(['id_jefe' => $jefeUser->id]);
                }
                $jefesResolved++;
            } else {
                if (!isset($jefesNotFound[$jefeName])) {
                    $jefesNotFound[$jefeName] = 0;
                }
                $jefesNotFound[$jefeName]++;
            }
        }

        $this->line("  Jefes resolved: $jefesResolved / " . count($jefeQueue));

        if (!empty($jefesNotFound)) {
            $this->newLine();
            $this->warn('  Jefes not found in DB:');
            foreach ($jefesNotFound as $name => $count) {
                $this->line("    ✗ \"$name\" ($count references)");
            }
        }

        // Phase 3: Propagate dept→area linkage
        if (!$dryRun) {
            $this->newLine();
            $this->info('━━━ Phase 3: Dept→Area linkage ━━━');
            $deptFixed = 0;
            $orphaned = Departamento::whereNull('id_area')->get();
            foreach ($orphaned as $dept) {
                $mostCommon = User::where('id_departamento', $dept->id)
                    ->whereNotNull('id_area')
                    ->selectRaw('id_area, COUNT(*) as cnt')
                    ->groupBy('id_area')
                    ->orderByDesc('cnt')
                    ->value('id_area');
                if ($mostCommon) {
                    $dept->update(['id_area' => $mostCommon]);
                    $deptFixed++;
                }
            }
            $this->line("  Fixed: $deptFixed orphaned departments");
        }

        // Summary
        $this->newLine();
        if ($dryRun) {
            $this->warn('No changes were made. Run with --apply to execute.');
        } else {
            $this->info('✅ Import completed successfully.');
        }

        return self::SUCCESS;
    }
}
