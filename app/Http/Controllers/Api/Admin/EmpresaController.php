<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Empresa;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EmpresaController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Empresa::all());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'direccion' => 'nullable|string',
        ]);

        $empresa = Empresa::create($validated);

        return response()->json($empresa, 201);
    }

    public function show(Empresa $empresa): JsonResponse
    {
        return response()->json($empresa);
    }

    public function update(Request $request, Empresa $empresa): JsonResponse
    {
        $validated = $request->validate([
            'nombre' => 'sometimes|required|string|max:255',
            'direccion' => 'nullable|string',
        ]);

        $empresa->update($validated);

        return response()->json($empresa);
    }

    public function destroy(Empresa $empresa): JsonResponse
    {
        $empresa->delete();

        return response()->json(null, 204);
    }
}
