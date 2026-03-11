<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Area;
use App\Models\Categoria;
use App\Models\Cdc;
use App\Models\Curso;
use App\Models\Departamento;
use App\Models\Empresa;
use App\Models\Habilidad;
use App\Models\Presupuesto;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    /**
     * Get all organizational data for selects/filters
     */
    public function metadata(): JsonResponse
    {
        return response()->json([
            'empresas'     => Empresa::all(),
            'areas'        => Area::all(),
            'departamentos' => Departamento::with('area')->get(),
            'habilidades'  => Habilidad::all(),
            'cdcs'         => Cdc::with('departamento.area')->get(),
            'categorias'   => Categoria::all(),
            'proveedores'  => \App\Models\Proveedor::all(),
            'programas'    => \App\Models\ProgramaAsociado::where('activo', 1)->get(),
            'modalidades'  => \App\Models\Modalidad::all(),
            'cursos_tipos' => \App\Models\CursoTipo::all(),
            'users'        => User::with('departamento.area')->get(),
            'presupuestos' => \App\Models\PresupuestoGrupo::with('presupuestos')->get(),
            'roles'        => ['user', 'jefe_area', 'jefe_general', 'admin'],
        ]);
    }

    /**
     * Detailed user list for RH
     */
    public function users(Request $request): JsonResponse
    {
        $query = User::with(['departamento.area', 'empresa', 'areaRel', 'jefe']);

        if ($request->has('area_id')) {
            $query->whereHas('departamento', fn ($q) => $q->where('id_area', $request->area_id));
        }

        if ($request->has('search')) {
            $query->where('name', 'like', '%'.$request->search.'%')
                ->orWhere('email', 'like', '%'.$request->search.'%');
        }

        return response()->json($query->paginate(20));
    }

    /**
     * Update user role/cargo manually
     */
    public function updateUser(Request $request, User $user)
    {
        $validated = $request->validate([
            'role'           => 'sometimes|string|in:user,jefe_area,jefe_general,admin',
            'cargo'          => 'sometimes|string|nullable',
            'id_departamento' => 'sometimes|exists:departamentos,id|nullable',
        ]);

        $user->update($validated);

        return redirect()->back();
    }

    /**
     * Synchronize all users from Active Directory
     */
    public function syncActiveDirectory(\App\Services\LdapService $ldapService)
    {
        try {
            $stats = $ldapService->syncAllUsers();

            $skippedCount = count($stats['skipped'] ?? []);
            $msg = "Sincronización completada. Creados: {$stats['created']}, Actualizados: {$stats['updated']}.";
            if ($skippedCount > 0) {
                $msg .= " Se omitieron {$skippedCount} usuarios sin datos completos (departamento/cargo).";
            }

            return redirect()->back()
                ->with('success', $msg)
                ->with('sync_skipped', $stats['skipped'] ?? []);
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['ldap' => $e->getMessage()]);
        }
    }

    /**
     * Store manual user (RH)
     */
    public function storeUser(Request $request)
    {
        $validated = $request->validate([
            'name'           => 'required|string|max:255',
            'email'          => 'required|string|email|max:255|unique:users',
            'role'           => 'required|string|in:user,jefe_area,jefe_general,admin',
            'cargo'          => 'nullable|string|max:255',
            'id_departamento' => 'nullable|exists:departamentos,id',
            'area'           => 'nullable|string|max:255',
        ]);

        $validated['password'] = \Illuminate\Support\Facades\Hash::make(\Illuminate\Support\Str::random(12));

        User::create($validated);

        return redirect()->back();
    }

    /**
     * Bulk course management for RH
     */
    public function courses(Request $request): JsonResponse
    {
        return response()->json(Curso::withCount('users')->with(['habilidad', 'categoria', 'tipoCapacitacion'])->paginate(20));
    }

    /**
     * Store new course
     */
    public function storeCourse(Request $request)
    {
        $input = $request->all();

        if (isset($input['id_habilidad']) && !is_numeric($input['id_habilidad']) && !empty($input['id_habilidad'])) {
            $input['id_habilidad'] = \App\Models\Habilidad::firstOrCreate(['habilidad' => $input['id_habilidad']])->id;
        }
        if (isset($input['id_categoria']) && !is_numeric($input['id_categoria']) && !empty($input['id_categoria'])) {
            $input['id_categoria'] = \App\Models\Categoria::firstOrCreate(['categoria' => $input['id_categoria']])->id;
        }
        if (isset($input['id_modalidad']) && !is_numeric($input['id_modalidad']) && !empty($input['id_modalidad'])) {
            $input['id_modalidad'] = \App\Models\Modalidad::firstOrCreate(['modalidad' => $input['id_modalidad']])->id;
        }
        if (isset($input['id_proveedor']) && !is_numeric($input['id_proveedor']) && !empty($input['id_proveedor'])) {
            $input['id_proveedor'] = \App\Models\Proveedor::firstOrCreate(['provedor' => $input['id_proveedor']])->id;
        }

        $validated = \Illuminate\Support\Facades\Validator::make($input, [
            'nombre'              => 'required|string|max:255',
            'descripcion'         => 'required|string',
            'inicio'              => 'required|date',
            'fin'                 => 'required|date|after_or_equal:inicio',
            'capacidad'           => 'required|integer|min:1',
            'costo'               => 'required|numeric|min:0',
            'cant_horas'          => 'nullable|numeric',
            'id_habilidad'        => 'required',
            'id_categoria'        => 'required',
            'id_modalidad'        => 'nullable|exists:modalidads,id',
            'id_tipo'             => 'required|exists:cursos_tipos,id',
            'id_proveedor'        => 'nullable|exists:proveedors,id',
            'id_programa_asociado' => 'nullable|exists:programas_asociados,id',
            'id_presupuesto'      => 'nullable|exists:presupuesto_grupos,id',
            'costo_cero'          => 'sometimes|boolean',
            'publicado'           => 'sometimes|boolean',
            'mes_pago'            => 'nullable|string',
            'twiins'              => 'sometimes|boolean',
            'jornadas'            => 'nullable|string',
            'certificado'         => 'sometimes|boolean',
            'anio_formacion'      => 'nullable|integer',
            'mes_formacion'       => 'nullable|string',
            'horarios'            => 'nullable|string',
            // Multi-CDC: array of { cdc_id, monto }
            'cdc_items'           => 'nullable|array',
            'cdc_items.*.cdc_id'  => 'required|exists:cdcs,id',
            'cdc_items.*.monto'   => 'required|numeric|min:0',
        ])->validate();

        $cdcItems = $validated['cdc_items'] ?? [];
        unset($validated['cdc_items']);

        $courseData = $validated;
        if (isset($courseData['id_habilidad'])) {
            $courseData['habilidad_id'] = $courseData['id_habilidad'];
            unset($courseData['id_habilidad']);
        }
        if (isset($courseData['id_categoria'])) {
            $courseData['categoria_id'] = $courseData['id_categoria'];
            unset($courseData['id_categoria']);
        }

        $course = Curso::create($courseData);

        // We will sync users first, so we know who is enrolled, then sync the CDC fractions
        if ($request->has('selected_users') && is_array($request->selected_users)) {
            $estadoMatriculado = \App\Models\EstadoCurso::where('estado', 'matriculado')->first();
            if ($estadoMatriculado) {
                foreach ($request->selected_users as $userId) {
                    $this->attachUserToCourse($course, $userId, $estadoMatriculado->id, $request->user()?->id);
                }
            }
        }

        // Sync CDCs pivot and deduct global budget (distributing among users if any)
        if (!empty($cdcItems)) {
            $this->distributeCdcFractions($course, $cdcItems, true);
        }

        return redirect()->back();
    }

    /**
     * Update existing course
     */
    public function updateCourse(Request $request, Curso $course)
    {
        $validated = $request->validate([
            'nombre'              => 'sometimes|string|max:255',
            'descripcion'         => 'nullable|string',
            'inicio'              => 'sometimes|date',
            'fin'                 => 'sometimes|date|after_or_equal:inicio',
            'capacidad'           => 'sometimes|integer|min:1',
            'costo'               => 'sometimes|numeric|min:0',
            'cant_horas'          => 'nullable|numeric',
            'habilidad_id'        => 'nullable|exists:habilidads,id',
            'categoria_id'        => 'nullable|exists:categorias,id',
            'id_modalidad'        => 'nullable|exists:modalidads,id',
            'id_tipo'             => 'nullable|exists:cursos_tipos,id',
            'id_proveedor'        => 'nullable|exists:proveedors,id',
            'id_programa_asociado' => 'nullable|exists:programas_asociados,id',
            'id_presupuesto'      => 'nullable|exists:presupuesto_grupos,id',
            'costo_cero'          => 'sometimes|boolean',
            'publicado'           => 'sometimes|boolean',
            'mes_pago'            => 'nullable|string',
            'twiins'              => 'sometimes|boolean',
            'jornadas'            => 'nullable|string',
            'certificado'         => 'sometimes|boolean',
            'anio_formacion'      => 'nullable|integer',
            'mes_formacion'       => 'nullable|string',
            'horarios'            => 'nullable|string',
            // Multi-CDC
            'cdc_items'           => 'nullable|array',
            'cdc_items.*.cdc_id'  => 'required|exists:cdcs,id',
            'cdc_items.*.monto'   => 'required|numeric|min:0',
        ]);

        $cdcItems = $validated['cdc_items'] ?? null;
        unset($validated['cdc_items']);

        $oldCostoCero = $course->costo_cero;
        $oldPresupuesto = $course->id_presupuesto;
        $oldCdcs = $course->cdcs()->get(); // fetch relation before update

        // 1. REFUND old amounts
        if ($oldPresupuesto && !$oldCostoCero) {
            foreach ($oldCdcs as $oldCdc) {
                $monto = (float) $oldCdc->pivot->monto;
                if ($monto > 0 && $oldCdc->id_departamento) {
                    $presupuesto = \App\Models\Presupuesto::where('id_departamento', $oldCdc->id_departamento)
                        ->where('id_grupo', $oldPresupuesto)
                        ->first();
                    $presupuesto?->restore($monto);
                }
            }
        }

        $course->update($validated);

        if ($cdcItems !== null) {
            $this->distributeCdcFractions($course, $cdcItems, true);
        }

        return redirect()->back();
    }

    /**
     * Delete a course from the structure tab
     */
    public function destroyCourse(Curso $course)
    {
        // Restore budget before delete (using grouped original totals)
        if ($course->id_presupuesto && !$course->costo_cero) {
            $totals = \Illuminate\Support\Facades\DB::table('cdc_curso')
                ->where('curso_id', $course->id)
                ->selectRaw('cdc_id, id_departamento, SUM(monto) as total')
                ->groupBy('cdc_id', 'id_departamento')
                ->get();

            foreach ($totals as $oldCdc) {
                $monto = (float) $oldCdc->total;
                if ($monto > 0 && $oldCdc->id_departamento) {
                    $presupuesto = \App\Models\Presupuesto::where('id_departamento', $oldCdc->id_departamento)
                        ->where('id_grupo', $course->id_presupuesto)
                        ->first();
                    $presupuesto?->restore($monto);
                }
            }
        }

        $course->delete();
        return redirect()->back();
    }

    /**
     * Update enrollment state
     */
    public function updateStatus(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'curso_id' => 'required|exists:cursos,id',
            'estado'   => 'required|string',
        ]);

        $user  = User::findOrFail($validated['user_id']);
        $curso = Curso::findOrFail($validated['curso_id']);

        try {
            app(\App\Services\EnrollmentService::class)->updateState(
                $user,
                $curso,
                $validated['estado'],
                $request->user()
            );

            return response()->json(['message' => 'Estado actualizado correctamente.']);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * Manually enroll a user into a course (status: Matriculado)
     * with automatic budget deduction from cdc.inversion
     */
    public function enrollManual(Request $request, Curso $course): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        $user             = User::findOrFail($validated['user_id']);
        $estadoMatriculado = \App\Models\EstadoCurso::where('estado', 'matriculado')->firstOrFail();

        // If already enrolled, use updateState
        if ($course->users()->where('id_user', $user->id)->exists()) {
            try {
                app(\App\Services\EnrollmentService::class)->updateState(
                    $user,
                    $course,
                    'matriculado',
                    $request->user()
                );
            } catch (\Exception $e) {
                return response()->json(['message' => $e->getMessage()], 422);
            }
        } else {
            $this->attachUserToCourse($course, $user->id, $estadoMatriculado->id, $request->user()->id);
        }

        return response()->json(['message' => 'Colaborador matriculado correctamente.']);
    }

    /**
     * Attach a user to a course.
     */
    private function attachUserToCourse(Curso $course, int $userId, int $estadoId, ?int $modUserId): void
    {
        $course->users()->attach($userId, [
            'curso_estado'   => $estadoId,
            'id_user_mod'    => $modUserId,
            'id_presupuesto' => $course->id_presupuesto,
        ]);
    }

    /**
     * Destroy an enrollment and restore budget
     */
    public function destroyEnrollment(int $id)
    {
        $enrollment = \App\Models\CursoUser::findOrFail($id);
        $course = Curso::find($enrollment->id_curso);

        $enrollment->delete();

        // Recalculate fractions for remaining participants
        $this->recalculateExistingCdcFractions($course);

        return redirect()->back();
    }

    /**
     * Generic structure update
     */
    public function updateResource(Request $request, string $type, int $id)
    {
        $modelClass = $this->resolveModel($type);

        if (! $modelClass) {
            return response()->json(['message' => 'Tipo no válido.'], 400);
        }

        $item = $modelClass::findOrFail($id);

        $validated = $request->validate($this->resourceRules($type));

        // For presupuestos: actual cannot be set manually below 0
        if ($type === 'presupuestos' && isset($validated['actual'])) {
            if ($validated['actual'] < 0) {
                return back()->withErrors(['actual' => 'El presupuesto actual no puede ser negativo.']);
            }
        }

        // When updating inicial, also proportionally adjust actual to match if no actual provided
        if ($type === 'presupuestos' && isset($validated['inicial']) && !isset($validated['actual'])) {
            $diff = $validated['inicial'] - $item->inicial;
            $validated['actual'] = max(0, $item->actual + $diff);
        }

        $item->update($validated);

        return redirect()->back();
    }

    /**
     * Generic structure store
     */
    public function storeResource(Request $request, string $type)
    {
        $modelClass = $this->resolveModel($type);

        if (! $modelClass) {
            return response()->json(['message' => 'Tipo no válido.'], 400);
        }

        // Batch creation for presupuestos: { fecha, items: [{id_departamento, inicial}] }
        if ($type === 'presupuestos' && $request->has('items')) {
            $request->validate([
                'fecha'              => 'required|integer|min:2000|max:2100',
                'descripcion'        => 'nullable|string|max:500',
                'items'              => 'required|array|min:1',
                'items.*.id_departamento' => 'required|exists:departamentos,id',
                'items.*.inicial'    => 'required|numeric|min:0',
            ]);

            // Create the parent grupo
            $grupo = \App\Models\PresupuestoGrupo::create([
                'fecha'       => $request->fecha,
                'descripcion' => $request->descripcion,
            ]);

            foreach ($request->items as $item) {
                Presupuesto::create([
                    'fecha'            => $request->fecha,
                    'descripcion'      => $request->descripcion,
                    'id_departamento'  => $item['id_departamento'],
                    'inicial'          => $item['inicial'],
                    'actual'           => $item['inicial'],
                    'id_grupo'         => $grupo->id,
                ]);
            }

            return redirect()->back();
        }

        $validated = $request->validate($this->resourceRules($type));

        // For presupuestos: set actual = inicial on creation
        if ($type === 'presupuestos' && isset($validated['inicial'])) {
            $validated['actual'] = $validated['inicial'];
        }

        $modelClass::create($validated);

        return redirect()->back();
    }

    /**
     * Generic structure destroy
     */
    public function destroyResource(string $type, int $id)
    {
        $modelClass = $this->resolveModel($type);

        if (! $modelClass) {
            return response()->json(['message' => 'Tipo no válido.'], 400);
        }

        $item = $modelClass::findOrFail($id);
        $item->delete();

        return redirect()->back();
    }

    private function resolveModel(string $type): ?string
    {
        return match ($type) {
            'empresas'           => \App\Models\Empresa::class,
            'areas'              => \App\Models\Area::class,
            'departamentos'      => \App\Models\Departamento::class,
            'cdcs'               => \App\Models\Cdc::class,
            'categorias'         => \App\Models\Categoria::class,
            'habilidades'        => \App\Models\Habilidad::class,
            'proveedores'        => \App\Models\Proveedor::class,
            'programas_asociados' => \App\Models\ProgramaAsociado::class,
            'presupuestos'       => Presupuesto::class,
            'cursos'             => Curso::class,
            default              => null,
        };
    }

    private function resourceRules(string $type): array
    {
        $common = [
            'nombre'          => 'sometimes|string|max:255',
            'cdc'             => 'sometimes|string|max:255',
            'categoria'       => 'sometimes|string|max:255',
            'habilidad'       => 'sometimes|string|max:255',
            'provedor'        => 'sometimes|string|max:255',
            'contacto'        => 'nullable|string|max:255',
            'telefono'        => 'nullable|string|max:50',
            'email'           => 'nullable|email|max:255',
            'programa'        => 'sometimes|string|max:255',
            'descripcion'     => 'nullable|string',
            'id_area'         => 'sometimes|exists:areas,id',
            'id_empresa'      => 'sometimes|exists:empresas,id',
            'activo'          => 'sometimes|boolean',
        ];

        $extra = match ($type) {
            'cdcs' => [
                'inversion'        => 'sometimes|numeric|min:0',
                'id_departamento'  => 'sometimes|nullable|exists:departamentos,id',
            ],
            'presupuestos' => [
                'fecha'            => 'sometimes|integer|min:2000|max:2100',
                'inicial'          => 'sometimes|numeric|min:0',
                'actual'           => 'sometimes|numeric|min:0',
                'id_departamento'  => 'sometimes|nullable|exists:departamentos,id',
                'id_grupo'         => 'sometimes|nullable|exists:presupuesto_grupos,id',
                'descripcion'      => 'nullable|string|max:500',
            ],
            'cursos' => [
                'nombre'           => 'required|string|max:255',
                'descripcion'      => 'nullable|string',
                'inicio'           => 'sometimes|date',
                'fin'              => 'sometimes|date',
                'capacidad'        => 'sometimes|integer|min:1',
                'costo'            => 'sometimes|numeric|min:0',
                'cant_horas'       => 'nullable|numeric',
                'habilidad_id'     => 'nullable|exists:habilidads,id',
                'categoria_id'     => 'nullable|exists:categorias,id',
                'id_cdc'           => 'nullable|exists:cdcs,id',
                'id_modalidad'     => 'nullable|exists:modalidads,id',
                'id_tipo'          => 'nullable|exists:cursos_tipos,id',
                'id_proveedor'     => 'nullable|exists:proveedors,id',
                'id_programa_asociado' => 'nullable|exists:programas_asociados,id',
                'publicado'        => 'sometimes|boolean',
                'mes_pago'         => 'nullable|string',
                'twiins'           => 'sometimes|boolean',
                'jornadas'         => 'nullable|string',
                'certificado'      => 'sometimes|boolean',
                'anio_formacion'   => 'nullable|integer',
                'mes_formacion'    => 'nullable|string',
                'horarios'         => 'nullable|string',
            ],
            default => [],
        };

        return array_merge($common, $extra);
    }

    /**
     * Get all enrollments for a specific course grouped by state
     */
    public function courseEnrollments(Request $request, Curso $course): JsonResponse
    {
        $user = $request->user();
        $is_admin = $user->role === 'admin';
        $is_lider = $user->role === 'lider' || \App\Models\User::where('id_jefe', $user->id)->exists();

        $query = $course->users()->with(['departamento.area']);

        if ($is_lider && !$is_admin) {
            $teamMemberIds = \App\Models\User::where('id_jefe', $user->id)->pluck('id');
            $query->whereIn('cursos_users.id_user', $teamMemberIds);
        }

        $enrollments = $query->get()
            ->map(function ($user) {
                return [
                    'id'     => $user->id,
                    'name'   => $user->name,
                    'email'  => $user->email,
                    'cargo'  => $user->cargo,
                    'area'   => $user->departamento?->area?->nombre,
                    'estado' => \App\Models\EstadoCurso::find($user->pivot->curso_estado)?->estado,
                ];
            });

        return response()->json($enrollments);
    }

    private function distributeCdcFractions(Curso $course, array $cdcItems, bool $deductBudget = false): void
    {
        $users = $course->users()->pluck('users.id')->toArray();
        $userCount = count($users);
        $syncData = [];

        foreach ($cdcItems as $item) {
            $cdcId = $item['cdc_id'] ?? $item['id'] ?? null;
            if (!$cdcId) continue;

            $totalMonto = (float) $item['monto'];
            $cdcRecord = \App\Models\Cdc::find($cdcId);
            if (!$cdcRecord) continue;

            // Optional deduction
            if ($deductBudget && $course->id_presupuesto && !$course->costo_cero && $totalMonto > 0 && $cdcRecord->id_departamento) {
                $presupuesto = \App\Models\Presupuesto::where('id_departamento', $cdcRecord->id_departamento)
                    ->where('id_grupo', $course->id_presupuesto)
                    ->first();
                $presupuesto?->deduct($totalMonto);
            }

            if ($userCount === 0) {
                // If nobody is enrolled, keep the full amount under no user
                $syncData[] = [
                    'curso_id' => $course->id,
                    'cdc_id' => $cdcId,
                    'user_id' => null,
                    'id_departamento' => $cdcRecord->id_departamento,
                    'monto' => $totalMonto,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            } else {
                // Divide equally
                $fraction = $totalMonto / $userCount;
                foreach ($users as $uId) {
                    $syncData[] = [
                        'curso_id' => $course->id,
                        'cdc_id' => $cdcId,
                        'user_id' => $uId,
                        'id_departamento' => $cdcRecord->id_departamento,
                        'monto' => $fraction,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }
            }
        }

        \Illuminate\Support\Facades\DB::table('cdc_curso')->where('curso_id', $course->id)->delete();
        if (!empty($syncData)) {
            \Illuminate\Support\Facades\DB::table('cdc_curso')->insert($syncData);
        }
    }

    private function recalculateExistingCdcFractions(Curso $course): void
    {
        $totals = \Illuminate\Support\Facades\DB::table('cdc_curso')
            ->where('curso_id', $course->id)
            ->selectRaw('cdc_id, SUM(monto) as total')
            ->groupBy('cdc_id')
            ->get();

        $cdcItems = $totals->map(fn($t) => ['cdc_id' => $t->cdc_id, 'monto' => $t->total])->toArray();
        if (!empty($cdcItems)) {
            $this->distributeCdcFractions($course, $cdcItems, false);
        }
    }
}

