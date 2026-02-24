<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Habilidad;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HabilidadController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Habilidad::all());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'habilidad' => 'required|string|max:255',
            'descripcion' => 'nullable|string',
        ]);

        $habilidad = Habilidad::create($validated);

        return response()->json($habilidad, 201);
    }

    public function show(Habilidad $habilidad): JsonResponse
    {
        return response()->json($habilidad);
    }

    public function update(Request $request, Habilidad $habilidad): JsonResponse
    {
        $validated = $request->validate([
            'habilidad' => 'sometimes|required|string|max:255',
            'descripcion' => 'nullable|string',
        ]);

        $habilidad->update($validated);

        return response()->json($habilidad);
    }

    public function destroy(Habilidad $habilidad): JsonResponse
    {
        $habilidad->delete();

        return response()->json(null, 204);
    }
}
