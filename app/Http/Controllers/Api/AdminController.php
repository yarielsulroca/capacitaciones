<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Curso;
use App\Models\Empresa;
use App\Models\Area;
use App\Models\Departamento;
use App\Models\Habilidad;
use App\Models\Cdc;
use App\Models\Categoria;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

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
            'departamentos' => Departamento::all(),
            'habilidades' => Habilidad::all(),
            'cdcs' => Cdc::all(),
            'categorias' => Categoria::all(),
        ]);
    }

    /**
     * Detailed user list for RH
     */
    public function users(Request $request): JsonResponse
    {
        $query = User::with('departamento.area');

        if ($request->has('area_id')) {
            $query->whereHas('departamento', fn($q) => $q->where('id_area', $request->area_id));
        }

        return response()->json($query->paginate(20));
    }

    /**
     * Bulk course management for RH
     */
    public function courses(Request $request): JsonResponse
    {
        // Reuse logic from CourseController but with more details for Admin
        return response()->json(Curso::withCount('users')->paginate(20));
    }

    /**
     * Update enrollment state (Used by Admin/Boss)
     */
    public function updateStatus(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'curso_id' => 'required|exists:cursos,id',
            'estado' => 'required|string', // solicitado, procesando, matriculado, cancelado, terminado, incompleto, certificado
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
}
