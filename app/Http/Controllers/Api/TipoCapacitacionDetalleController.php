<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TipoCapacitacionDetalle;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class TipoCapacitacionDetalleController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(TipoCapacitacionDetalle::with('tipoCapacitacion')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'id_tipo_capacitacion' => 'required|exists:tipo_capacitacions,id',
        ]);

        $detalle = TipoCapacitacionDetalle::create($validated);
        return response()->json($detalle, 201);
    }

    public function show(TipoCapacitacionDetalle $detalle): JsonResponse
    {
        return response()->json($detalle->load('tipoCapacitacion'));
    }

    public function update(Request $request, TipoCapacitacionDetalle $detalle): JsonResponse
    {
        $validated = $request->validate([
            'nombre' => 'sometimes|required|string|max:255',
            'id_tipo_capacitacion' => 'sometimes|required|exists:tipo_capacitacions,id',
        ]);

        $detalle->update($validated);
        return response()->json($detalle);
    }

    public function destroy(TipoCapacitacionDetalle $detalle): JsonResponse
    {
        $detalle->delete();
        return response()->json(null, 204);
    }
}
