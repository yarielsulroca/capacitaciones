<?php

namespace App\Services;

class LdapService
{
    protected $connection;

    public function __construct()
    {
        $this->connection = ldap_connect(config('services.ldap.host'), config('services.ldap.port'));
        ldap_set_option($this->connection, LDAP_OPT_PROTOCOL_VERSION, 3);
        ldap_set_option($this->connection, LDAP_OPT_REFERRALS, 0);
    }

    /**
     * Authenticate a user against LDAP.
     */
    public function authenticate($username, $password)
    {
        \Illuminate\Support\Facades\Log::info("LDAP: Attempting authentication for $username");

        if (! $this->bindSystem()) {
            \Illuminate\Support\Facades\Log::error('LDAP: System bind failed for '.config('services.ldap.username'));

            return false;
        }

        $filter = "(samaccountname=$username)";
        $search = ldap_search($this->connection, config('services.ldap.base_dn'), $filter);
        $entries = ldap_get_entries($this->connection, $search);

        if ($entries['count'] === 0) {
            \Illuminate\Support\Facades\Log::warning("LDAP: User not found for filter $filter");

            return false;
        }

        $userDn = $entries[0]['dn'];
        \Illuminate\Support\Facades\Log::info("LDAP: Found DN: $userDn. Attempting bind...");

        if (@ldap_bind($this->connection, $userDn, $password)) {
            \Illuminate\Support\Facades\Log::info("LDAP: Authentication successful for $username");

            return $entries[0];
        }

        \Illuminate\Support\Facades\Log::warning("LDAP: Authentication failed (bind) for $username");

        return false;
    }

    protected function bindSystem()
    {
        return @ldap_bind(
            $this->connection,
            config('services.ldap.username'),
            config('services.ldap.password')
        );
    }

    /**
     * Extract attributes from LDAP entry.
     */
    public function getAttributes($entry)
    {
        return [
            'name' => $entry['displayname'][0] ?? $entry['cn'][0] ?? null,
            'email' => $entry['mail'][0] ?? null,
            'department' => $entry['department'][0] ?? null,
            'title' => $entry['title'][0] ?? null, // Cargo
            'area' => $entry['description'][0] ?? $entry['physicaldeliveryofficename'][0] ?? null,
        ];
    }

    /**
     * Synchronize all active users from AD.
     */
    public function syncAllUsers(): array
    {
        // Allow up to 5 minutes for large LDAP syncs (700+ users)
        set_time_limit(300);

        \Illuminate\Support\Facades\Log::info("LDAP: Starting full user synchronization");

        if (! $this->bindSystem()) {
            \Illuminate\Support\Facades\Log::error('LDAP: System bind failed during sync.');
            throw new \Exception("No se pudo conectar al Directorio Activo (System Bind Failed).");
        }

        // Filtro para traer a todos los que son persona (usuario) y no están deshabilitados.
        $filter = '(&(objectCategory=person)(objectClass=user)(!(userAccountControl:1.2.840.113556.1.4.803:=2)))';
        $attributes = [
            'displayname', 'cn', 'mail', 'department', 'title', 'description',
            'physicaldeliveryofficename', 'samaccountname', 'c', 'l', 'company', 'manager'
        ];

        $search = @ldap_search($this->connection, config('services.ldap.base_dn'), $filter, $attributes);

        if (!$search) {
            throw new \Exception("Error al buscar en el Directorio Activo: " . ldap_error($this->connection));
        }

        $entries = ldap_get_entries($this->connection, $search);

        $stats = ['created' => 0, 'updated' => 0, 'skipped' => []];

        // Caches for relations to avoid query spam
        $departamentosCache = [];
        $empresasCache = [];
        $areasCache = [];

        // This will temporarily store user_id => manager_dn mapping for the second pass
        $managerMappings = [];

        for ($i = 0; $i < $entries['count']; $i++) {
            $entry = $entries[$i];

            $email = $entry['mail'][0] ?? null;
            $username = $entry['samaccountname'][0] ?? null;
            $name = $entry['displayname'][0] ?? $entry['cn'][0] ?? null;

            if (!$email && !$username) continue;
            if (!$name) continue;

            $identifyingEmail = $email ?? ($username . '@' . explode(',', config('services.ldap.base_dn'))[0]);
            $identifyingEmail = str_replace('DC=', '', $identifyingEmail);

            $cargo = isset($entry['title'][0]) ? substr($entry['title'][0], 0, 255) : null;
            $pais = isset($entry['c'][0]) ? substr($entry['c'][0], 0, 255) : null;
            $ciudad = isset($entry['l'][0]) ? substr($entry['l'][0], 0, 255) : null;
            $oficina = isset($entry['physicaldeliveryofficename'][0]) ? substr($entry['physicaldeliveryofficename'][0], 0, 255) : null;
            $managerDn = $entry['manager'][0] ?? null;
            // Resolving Departamento
            $adDepartmentName = isset($entry['department'][0]) ? trim(substr($entry['department'][0], 0, 255)) : null;
            $deptId = null;

            // Reject invalid department names (Ticket #, empty, etc.)
            if ($adDepartmentName && stripos($adDepartmentName, 'Ticket') !== false) {
                $adDepartmentName = null;
            }

            if ($adDepartmentName) {
                if (isset($departamentosCache[$adDepartmentName])) {
                    $deptId = $departamentosCache[$adDepartmentName];
                } else {
                    $dbDept = \App\Models\Departamento::firstOrCreate(['nombre' => $adDepartmentName]);
                    $deptId = $dbDept->id;
                    $departamentosCache[$adDepartmentName] = $deptId;
                }
            }

            // Resolving Empresa (company)
            $adCompanyName = isset($entry['company'][0]) ? trim(substr($entry['company'][0], 0, 255)) : null;
            $empresaId = null;
            if ($adCompanyName) {
                if (isset($empresasCache[$adCompanyName])) {
                    $empresaId = $empresasCache[$adCompanyName];
                } else {
                    $dbEmpresa = \App\Models\Empresa::firstOrCreate(['nombre' => $adCompanyName]);
                    $empresaId = $dbEmpresa->id;
                    $empresasCache[$adCompanyName] = $empresaId;
                }
            }

            // Resolving Area — LDAP 'description' field IS the area name directly
            // e.g. "Gerencia de Operaciones" = area name
            $adAreaName = isset($entry['description'][0]) ? trim(substr($entry['description'][0], 0, 255)) : null;
            $areaId = null;

            // Reject invalid area names — only accept real organizational area names
            // Valid area names from LDAP start with: Gerencia, Presidencia, Vicepresidencia, Dirección
            if ($adAreaName) {
                $looksValid = preg_match('/^(Gerencia|Presidencia|Vicepresidencia|Direcci)/i', $adAreaName);
                if (!$looksValid) {
                    $adAreaName = null;
                }
            }

            if ($adAreaName) {
                if (isset($areasCache[$adAreaName])) {
                    $areaId = $areasCache[$adAreaName];
                } else {
                    $dbArea = \App\Models\Area::firstOrCreate(['nombre' => $adAreaName]);
                    $areaId = $dbArea->id;
                    $areasCache[$adAreaName] = $areaId;
                }
            }

            // Link Departamento to its Area (if both resolved)
            if ($deptId && $areaId) {
                \App\Models\Departamento::where('id', $deptId)
                    ->update(['id_area' => $areaId]);
            }

            // === SKIP non-collaborators: must have departamento AND cargo ===
            $missingFields = [];
            if (!$deptId)  $missingFields[] = 'departamento';
            if (!$cargo)   $missingFields[] = 'cargo';

            if (!empty($missingFields)) {
                $stats['skipped'][] = [
                    'name'   => $name,
                    'email'  => $identifyingEmail,
                    'reason' => 'Faltan: ' . implode(', ', $missingFields),
                ];
                continue; // Do NOT create/update this user
            }

            $user = \App\Models\User::where('email', $identifyingEmail)->first();

            if ($user) {
                $user->update([
                    'name' => $name,
                    'cargo' => $cargo ?: $user->cargo,
                    'pais' => $pais ?: $user->pais,
                    'ciudad' => $ciudad ?: $user->ciudad,
                    'oficina' => $oficina ?: $user->oficina,
                    'id_departamento' => $deptId ?: $user->id_departamento,
                    'id_empresa' => $empresaId ?: $user->id_empresa,
                    'id_area' => $areaId ?: $user->id_area,
                ]);
                $stats['updated']++;
            } else {
                $user = \App\Models\User::create([
                    'name' => $name,
                    'email' => $identifyingEmail,
                    'password' => null,
                    'role' => 'user',
                    'cargo' => $cargo,
                    'pais' => $pais,
                    'ciudad' => $ciudad,
                    'oficina' => $oficina,
                    'id_departamento' => $deptId,
                    'id_empresa' => $empresaId,
                    'id_area' => $areaId,
                ]);
                $stats['created']++;
            }

            // Queue manager for second pass
            if ($managerDn) {
                // Example: CN=Federico Bongiovanni,OU=Users,... -> we extract 'Federico Bongiovanni'
                if (preg_match('/CN=([^,]+)/', $managerDn, $matches)) {
                    $managerMappings[$user->id] = trim($matches[1]);
                }
            }
        }

        // ── POST-SYNC CLEANUP ──────────────────────────────────────

        // 1) Remove invalid AREAS — only keep real organizational areas
        $allAreas = \App\Models\Area::all();
        $invalidAreaIds = [];
        foreach ($allAreas as $area) {
            $looksValid = preg_match('/^(Gerencia|Presidencia|Vicepresidencia|Direcci)/i', $area->nombre);
            if (!$looksValid) {
                $invalidAreaIds[] = $area->id;
            }
        }
        if (!empty($invalidAreaIds)) {
            \App\Models\User::whereIn('id_area', $invalidAreaIds)->update(['id_area' => null]);
            \App\Models\Departamento::whereIn('id_area', $invalidAreaIds)->update(['id_area' => null]);
            \App\Models\Area::whereIn('id', $invalidAreaIds)->forceDelete();
            \Illuminate\Support\Facades\Log::info("LDAP Cleanup: Removed " . count($invalidAreaIds) . " invalid areas.");
        }

        // 2) Remove invalid DEPARTAMENTOS (containing "Ticket")
        $ticketDepts = \App\Models\Departamento::where('nombre', 'like', '%Ticket%')->get();
        if ($ticketDepts->count() > 0) {
            $ticketDeptIds = $ticketDepts->pluck('id')->toArray();
            // Null out references on users
            \App\Models\User::whereIn('id_departamento', $ticketDeptIds)->update(['id_departamento' => null]);
            \App\Models\Departamento::whereIn('id', $ticketDeptIds)->forceDelete();
            \Illuminate\Support\Facades\Log::info("LDAP Cleanup: Removed " . count($ticketDeptIds) . " invalid departamentos (Ticket).");
        }

        // 3) Backfill departamento->area linkage from user data
        $orphanedDepts = \App\Models\Departamento::whereNull('id_area')->pluck('id');
        foreach ($orphanedDepts as $deptIdToFix) {
            $mostCommonAreaId = \App\Models\User::where('id_departamento', $deptIdToFix)
                ->whereNotNull('id_area')
                ->select('id_area')
                ->groupBy('id_area')
                ->orderByRaw('COUNT(*) DESC')
                ->value('id_area');

            if ($mostCommonAreaId) {
                \App\Models\Departamento::where('id', $deptIdToFix)->update(['id_area' => $mostCommonAreaId]);
            }
        }

        // Second Pass: Resolve Managers
        foreach ($managerMappings as $userId => $managerName) {
            $managerUser = \App\Models\User::where('name', $managerName)->first();
            if ($managerUser) {
                \App\Models\User::where('id', $userId)->update(['id_jefe' => $managerUser->id]);
            }
        }

        // 4) Propagate id_area down through jefe hierarchy
        $areaFixes = 0;
        for ($pass = 0; $pass < 10; $pass++) {
            $fixed = \App\Models\User::whereNull('id_area')
                ->whereNotNull('id_jefe')
                ->whereHas('jefe', fn ($q) => $q->whereNotNull('id_area'))
                ->get();

            if ($fixed->isEmpty()) break;

            foreach ($fixed as $u) {
                $jefeArea = \App\Models\User::where('id', $u->id_jefe)->value('id_area');
                if ($jefeArea) {
                    $u->update(['id_area' => $jefeArea]);
                    $areaFixes++;
                }
            }
        }

        // 5) Propagate id_departamento down through jefe hierarchy for users missing it
        $deptFixes = 0;
        for ($pass = 0; $pass < 10; $pass++) {
            $fixed = \App\Models\User::whereNull('id_departamento')
                ->whereNotNull('id_jefe')
                ->whereHas('jefe', fn ($q) => $q->whereNotNull('id_departamento'))
                ->get();

            if ($fixed->isEmpty()) break;

            foreach ($fixed as $u) {
                $jefeDept = \App\Models\User::where('id', $u->id_jefe)->value('id_departamento');
                if ($jefeDept) {
                    $u->update(['id_departamento' => $jefeDept]);
                    $deptFixes++;
                }
            }
        }

        // 6) Re-run orphaned dept->area linkage after propagation
        $orphanedDepts2 = \App\Models\Departamento::whereNull('id_area')->pluck('id');
        foreach ($orphanedDepts2 as $deptIdToFix) {
            $mostCommonAreaId = \App\Models\User::where('id_departamento', $deptIdToFix)
                ->whereNotNull('id_area')
                ->selectRaw('id_area, COUNT(*) as cnt')
                ->groupBy('id_area')
                ->orderByRaw('COUNT(*) DESC')
                ->value('id_area');

            if ($mostCommonAreaId) {
                \App\Models\Departamento::where('id', $deptIdToFix)->update(['id_area' => $mostCommonAreaId]);
            }
        }

        if ($areaFixes > 0 || $deptFixes > 0) {
            \Illuminate\Support\Facades\Log::info("LDAP Hierarchy Propagation: {$areaFixes} users got id_area, {$deptFixes} users got id_departamento from jefe chain.");
        }

        $cleanedAreas = count($invalidAreaIds);
        $cleanedDepts = $ticketDepts->count();

        \Illuminate\Support\Facades\Log::info("LDAP Sync complete. Created: {$stats['created']}, Updated: {$stats['updated']}, Skipped: " . count($stats['skipped']) . ", CleanedAreas: $cleanedAreas, CleanedDepts: $cleanedDepts");
        return $stats;
    }
}
