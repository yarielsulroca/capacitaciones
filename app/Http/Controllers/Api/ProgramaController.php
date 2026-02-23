<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProgramaAsociado;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ProgramaController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(ProgramaAsociado::all());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
        ]);

        $programa = ProgramaAsociado::create($validated);
        return response()->json($programa, 201);
    }

    public function show(ProgramaAsociado $programa): JsonResponse
    {
        return response()->json($programa);
    }

    public function update(Request $request, ProgramaAsociado $programa): JsonResponse
    {
        $validated = $request->validate([
            'nombre' => 'sometimes|required|string|max:255',
        ]);

        $programa->update($validated);
        return response()->json($programa);
    }

    public function destroy(ProgramaAsociado $programa): JsonResponse
    {
        $programa->delete();
        return response()->json(null, 204);
    }
}
