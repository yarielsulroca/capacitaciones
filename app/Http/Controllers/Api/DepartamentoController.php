<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Departamento;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class DepartamentoController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Departamento::with('area.empresa')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'id_area' => 'required|exists:areas,id',
        ]);

        $departamento = Departamento::create($validated);
        return response()->json($departamento, 201);
    }

    public function show(Departamento $departamento): JsonResponse
    {
        return response()->json($departamento->load('area.empresa'));
    }

    public function update(Request $request, Departamento $departamento): JsonResponse
    {
        $validated = $request->validate([
            'nombre' => 'sometimes|required|string|max:255',
            'descripcion' => 'nullable|string',
            'id_area' => 'sometimes|required|exists:areas,id',
        ]);

        $departamento->update($validated);
        return response()->json($departamento);
    }

    public function destroy(Departamento $departamento): JsonResponse
    {
        $departamento->delete();
        return response()->json(null, 204);
    }
}
