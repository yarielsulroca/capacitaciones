<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Modalidad;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ModalidadController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Modalidad::all());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'descripcion' => 'nullable|string',
        ]);

        $modalidad = Modalidad::create($validated);

        return response()->json($modalidad, 201);
    }

    public function show(Modalidad $modalidad): JsonResponse
    {
        return response()->json($modalidad);
    }

    public function update(Request $request, Modalidad $modalidad): JsonResponse
    {
        $validated = $request->validate([
            'nombre' => 'sometimes|required|string|max:255',
            'descripcion' => 'nullable|string',
        ]);

        $modalidad->update($validated);

        return response()->json($modalidad);
    }

    public function destroy(Modalidad $modalidad): JsonResponse
    {
        $modalidad->delete();

        return response()->json(null, 204);
    }
}
