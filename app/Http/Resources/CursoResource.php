<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CursoResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nombre' => $this->nombre,
            'descripcion' => $this->descripcion,
            'cant_horas' => $this->cant_horas,
            'inicio' => $this->inicio->format('Y-m-d'),
            'fin' => $this->fin->format('Y-m-d'),
            'horarios' => $this->horarios,
            'costo' => $this->costo,
            'capacidad' => $this->capacidad,
            'habilidad' => $this->habilidad->habilidad ?? null,
            'categoria' => $this->categoria->categoria ?? null,
            'status' => $this->status ?? null,
            'created_at' => $this->created_at,
        ];
    }
}
