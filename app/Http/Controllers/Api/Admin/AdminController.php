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

        // Sync CDCs pivot
        if (!empty($cdcItems)) {
            $syncData = [];
            foreach ($cdcItems as $item) {
                $syncData[$item['cdc_id']] = ['monto' => $item['monto']];
            }
            $course->cdcs()->sync($syncData);
        }

        // Enroll selected users and deduct from all related CDC budgets
        if ($request->has('selected_users') && is_array($request->selected_users)) {
            $estadoMatriculado = \App\Models\EstadoCurso::where('estado', 'matriculado')->first();
            if ($estadoMatriculado) {
                foreach ($request->selected_users as $userId) {
                    $this->attachUserToCourse($course, $userId, $estadoMatriculado->id, $request->user()?->id);
                }
            }
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
            // Multi-CDC
            'cdc_items'           => 'nullable|array',
            'cdc_items.*.cdc_id'  => 'required|exists:cdcs,id',
            'cdc_items.*.monto'   => 'required|numeric|min:0',
        ]);

        $cdcItems = $validated['cdc_items'] ?? null;
        unset($validated['cdc_items']);

        $course->update($validated);

        // Sync CDCs pivot if provided
        if ($cdcItems !== null) {
            $syncData = [];
            foreach ($cdcItems as $item) {
                $syncData[$item['cdc_id']] = ['monto' => $item['monto']];
            }
            $course->cdcs()->sync($syncData);
        }

        return redirect()->back();
    }

    /**
     * Delete a course from the structure tab
     */
    public function destroyCourse(Curso $course)
    {
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

        // If already enrolled, use updateState to handle potential budget transitions
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
            $presupuestoId = $this->attachUserToCourse($course, $user->id, $estadoMatriculado->id, $request->user()->id);
            if ($presupuestoId === false) {
                return response()->json([
                    'message' => 'Presupuesto insuficiente.',
                ], 422);
            }
        }

        return response()->json(['message' => 'Colaborador matriculado correctamente.']);
    }

    /**
     * Attach a user to a course and deduct budget if applicable.
     * Returns the presupuesto ID used (or null if no CDC), or false if budget insufficient.
     */
    private function attachUserToCourse(Curso $course, int $userId, int $estadoId, ?int $modUserId): int|null|false
    {
        $service = app(\App\Services\EnrollmentService::class);

        // Use the service to check/deduct budget
        if (!$service->deductBudget(User::find($userId), $course, $course->id_presupuesto)) {
            return false;
        }

        $course->users()->attach($userId, [
            'curso_estado'  => $estadoId,
            'id_user_mod'   => $modUserId,
            'id_presupuesto' => $course->id_presupuesto,
        ]);

        return $course->id_presupuesto;
    }

    /**
     * Destroy an enrollment and restore budget
     */
    public function destroyEnrollment(int $id)
    {
        $enrollment = \App\Models\CursoUser::findOrFail($id);
        $course = Curso::find($enrollment->id_curso);
        $user = User::find($enrollment->id_user);

        if ($course && $user) {
            // Restore budget if they were matriculado
            $estado = \App\Models\EstadoCurso::find($enrollment->curso_estado);
            if ($estado && $estado->estado === 'matriculado') {
                app(\App\Services\EnrollmentService::class)->restoreBudget($user, $course, $enrollment->id_presupuesto);
            }
        }

        $enrollment->delete();

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
            ],
            default => [],
        };

        return array_merge($common, $extra);
    }

    /**
     * Get all enrollments for a specific course grouped by state
     */
    public function courseEnrollments(Curso $course): JsonResponse
    {
        $enrollments = $course->users()
            ->with(['departamento.area'])
            ->get()
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
}
