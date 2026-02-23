<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Area;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AreaController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Area::with('empresa')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'id_empresa' => 'required|exists:empresas,id',
        ]);

        $area = Area::create($validated);
        return response()->json($area, 201);
    }

    public function show(Area $area): JsonResponse
    {
        return response()->json($area->load('empresa'));
    }

    public function update(Request $request, Area $area): JsonResponse
    {
        $validated = $request->validate([
            'nombre' => 'sometimes|required|string|max:255',
            'descripcion' => 'nullable|string',
            'id_empresa' => 'sometimes|required|exists:empresas,id',
        ]);

        $area->update($validated);
        return response()->json($area);
    }

    public function destroy(Area $area): JsonResponse
    {
        $area->delete();
        return response()->json(null, 204);
    }
}
