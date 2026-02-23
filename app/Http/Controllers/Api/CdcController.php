<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cdc;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class CdcController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Cdc::all());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'cdc' => 'required|string|max:255',
            'descripcion' => 'nullable|string',
        ]);

        $cdc = Cdc::create($validated);
        return response()->json($cdc, 201);
    }

    public function show(Cdc $cdc): JsonResponse
    {
        return response()->json($cdc);
    }

    public function update(Request $request, Cdc $cdc): JsonResponse
    {
        $validated = $request->validate([
            'cdc' => 'sometimes|required|string|max:255',
            'descripcion' => 'nullable|string',
        ]);

        $cdc->update($validated);
        return response()->json($cdc);
    }

    public function destroy(Cdc $cdc): JsonResponse
    {
        $cdc->delete();
        return response()->json(null, 204);
    }
}
