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
            'empresas' => Empresa::all(),
            'areas' => Area::all(),
            'departamentos' => Departamento::with('area')->get(),
            'habilidades' => Habilidad::all(),
            'cdcs' => Cdc::all(),
            'categorias' => Categoria::all(),
            'proveedores' => \App\Models\Proveedor::all(),
            'programas' => \App\Models\ProgramaAsociado::where('activo', 1)->get(),
            'roles' => ['user', 'jefe_area', 'jefe_general', 'admin'],
        ]);
    }

    /**
     * Detailed user list for RH
     */
    public function users(Request $request): JsonResponse
    {
        $query = User::with('departamento.area');

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
            'role' => 'sometimes|string|in:user,jefe_area,jefe_general,admin',
            'cargo' => 'sometimes|string|nullable',
            'id_departamento' => 'sometimes|exists:departamentos,id|nullable',
        ]);

        $user->update($validated);

        return redirect()->back();
    }

    /**
     * Store manual user (RH)
     */
    public function storeUser(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'role' => 'required|string|in:user,jefe_area,jefe_general,admin',
            'cargo' => 'nullable|string|max:255',
            'id_departamento' => 'nullable|exists:departamentos,id',
            'area' => 'nullable|string|max:255',
        ]);

        // Default password for manual creation
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
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'descripcion' => 'required|string',
            'inicio' => 'required|date',
            'fin' => 'required|date|after_or_equal:inicio',
            'capacidad' => 'required|integer|min:1',
            'cant_horas' => 'nullable|numeric',
            'modalidad' => 'nullable|string',
            'id_habilidad' => 'nullable|exists:habilidads,id',
            'id_categoria' => 'nullable|exists:categorias,id',
            'id_cdc' => 'nullable|exists:cdcs,id',
            'id_programa_asociado' => 'nullable|exists:programas_asociados,id',
            'publicado' => 'sometimes|boolean',
        ]);

        $course = Curso::create($validated);

        return redirect()->back();
    }

    /**
     * Update existing course
     */
    public function updateCourse(Request $request, Curso $course)
    {
        $validated = $request->validate([
            'nombre' => 'sometimes|string|max:255',
            'descripcion' => 'nullable|string',
            'inicio' => 'sometimes|date',
            'fin' => 'sometimes|date|after_or_equal:inicio',
            'capacidad' => 'sometimes|integer|min:1',
            'cant_horas' => 'nullable|numeric',
            'modalidad' => 'nullable|string',
            'id_habilidad' => 'nullable|exists:habilidads,id',
            'id_categoria' => 'nullable|exists:categorias,id',
            'id_cdc' => 'nullable|exists:cdcs,id',
            'id_programa_asociado' => 'nullable|exists:programas_asociados,id',
            'publicado' => 'sometimes|boolean',
        ]);

        $course->update($validated);

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
            'estado' => 'required|string',
        ]);

        $user = User::findOrFail($validated['user_id']);
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
     * Generic structure update
     */
    public function updateResource(Request $request, string $type, int $id)
    {
        $modelClass = match ($type) {
            'empresas' => \App\Models\Empresa::class,
            'areas' => \App\Models\Area::class,
            'departamentos' => \App\Models\Departamento::class,
            'cdcs' => \App\Models\Cdc::class,
            'categorias' => \App\Models\Categoria::class,
            'habilidades' => \App\Models\Habilidad::class,
            'proveedores' => \App\Models\Proveedor::class,
            'programas_asociados' => \App\Models\ProgramaAsociado::class,
            default => null,
        };

        if (! $modelClass) {
            return response()->json(['message' => 'Tipo no válido.'], 400);
        }

        $item = $modelClass::findOrFail($id);

        $validated = $request->validate([
            'nombre' => 'sometimes|string|max:255',
            'cdc' => 'sometimes|string|max:255',
            'categoria' => 'sometimes|string|max:255',
            'habilidad' => 'sometimes|string|max:255',
            'provedor' => 'sometimes|string|max:255',
            'contacto' => 'nullable|string|max:255',
            'telefono' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'programa' => 'sometimes|string|max:255',
            'descripcion' => 'nullable|string',
            'id_area' => 'sometimes|exists:areas,id', // For departamentos
            'id_empresa' => 'sometimes|exists:empresas,id', // For areas
            'activo' => 'sometimes|boolean',
        ]);

        $item->update($validated);

        return redirect()->back();
    }
    /**
     * Generic structure store
     */
    public function storeResource(Request $request, string $type)
    {
        $modelClass = match ($type) {
            'empresas' => \App\Models\Empresa::class,
            'areas' => \App\Models\Area::class,
            'departamentos' => \App\Models\Departamento::class,
            'cdcs' => \App\Models\Cdc::class,
            'categorias' => \App\Models\Categoria::class,
            'habilidades' => \App\Models\Habilidad::class,
            'proveedores' => \App\Models\Proveedor::class,
            'programas_asociados' => \App\Models\ProgramaAsociado::class,
            default => null,
        };

        if (! $modelClass) {
            return response()->json(['message' => 'Tipo no válido.'], 400);
        }

        $validated = $request->validate([
            'nombre' => 'sometimes|string|max:255',
            'cdc' => 'sometimes|string|max:255',
            'categoria' => 'sometimes|string|max:255',
            'habilidad' => 'sometimes|string|max:255',
            'provedor' => 'sometimes|string|max:255',
            'contacto' => 'nullable|string|max:255',
            'telefono' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'programa' => 'sometimes|string|max:255',
            'descripcion' => 'nullable|string',
            'id_area' => 'sometimes|exists:areas,id', // For departamentos
            'id_empresa' => 'sometimes|exists:empresas,id', // For areas
            'activo' => 'sometimes|boolean',
        ]);

        $item = $modelClass::create($validated);

        return redirect()->back();
    }

    /**
     * Generic structure destroy
     */
    public function destroyResource(string $type, int $id)
    {
        $modelClass = match ($type) {
            'empresas' => \App\Models\Empresa::class,
            'areas' => \App\Models\Area::class,
            'departamentos' => \App\Models\Departamento::class,
            'cdcs' => \App\Models\Cdc::class,
            'categorias' => \App\Models\Categoria::class,
            'habilidades' => \App\Models\Habilidad::class,
            'proveedores' => \App\Models\Proveedor::class,
            'programas_asociados' => \App\Models\ProgramaAsociado::class,
            default => null,
        };

        if (! $modelClass) {
            return response()->json(['message' => 'Tipo no válido.'], 400);
        }

        $item = $modelClass::findOrFail($id);
        $item->delete();

        return redirect()->back();
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
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'cargo' => $user->cargo,
                    'area' => $user->departamento?->area?->nombre,
                    'estado' => \App\Models\EstadoCurso::find($user->pivot->curso_estado)?->estado,
                ];
            });

        return response()->json($enrollments);
    }

    /**
     * Manually enroll a user into a course (status: Matriculado)
     */
    public function enrollManual(Request $request, Curso $course): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        $user = User::findOrFail($validated['user_id']);
        $estadoMatriculado = \App\Models\EstadoCurso::where('estado', 'matriculado')->firstOrFail();

        // Check if already enrolled
        if ($course->users()->where('id_user', $user->id)->exists()) {
            $course->users()->updateExistingPivot($user->id, [
                'curso_estado' => $estadoMatriculado->id,
                'id_user_mod' => $request->user()->id,
            ]);
        } else {
            $course->users()->attach($user->id, [
                'curso_estado' => $estadoMatriculado->id,
                'id_user_mod' => $request->user()->id,
            ]);
        }

        return response()->json(['message' => 'Colaborador matriculado correctamente.']);
    }
}
