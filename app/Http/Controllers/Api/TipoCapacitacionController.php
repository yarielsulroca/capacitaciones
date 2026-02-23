<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TipoCapacitacion;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class TipoCapacitacionController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(TipoCapacitacion::all());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'cdc_id' => 'required|exists:cdcs,id',
        ]);

        $tipo = TipoCapacitacion::create($validated);
        return response()->json($tipo, 201);
    }

    public function show(TipoCapacitacion $tipo): JsonResponse
    {
        return response()->json($tipo->load('cdc'));
    }

    public function update(Request $request, TipoCapacitacion $tipo): JsonResponse
    {
        $validated = $request->validate([
            'nombre' => 'sometimes|required|string|max:255',
            'descripcion' => 'nullable|string',
            'cdc_id' => 'sometimes|required|exists:cdcs,id',
        ]);

        $tipo->update($validated);
        return response()->json($tipo);
    }

    public function destroy(TipoCapacitacion $tipo): JsonResponse
    {
        $tipo->delete();
        return response()->json(null, 204);
    }
}
