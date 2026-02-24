<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Presupuesto;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PresupuestoController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Presupuesto::with('empresa')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'anio' => 'required|integer',
            'monto' => 'required|numeric',
            'id_empresa' => 'required|exists:empresas,id',
        ]);

        $presupuesto = Presupuesto::create($validated);

        return response()->json($presupuesto, 201);
    }

    public function show(Presupuesto $presupuesto): JsonResponse
    {
        return response()->json($presupuesto->load('empresa'));
    }

    public function update(Request $request, Presupuesto $presupuesto): JsonResponse
    {
        $validated = $request->validate([
            'anio' => 'sometimes|required|integer',
            'monto' => 'sometimes|required|numeric',
            'id_empresa' => 'sometimes|required|exists:empresas,id',
        ]);

        $presupuesto->update($validated);

        return response()->json($presupuesto);
    }

    public function destroy(Presupuesto $presupuesto): JsonResponse
    {
        $presupuesto->delete();

        return response()->json(null, 204);
    }
}
