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
            'id'                   => $this->id,
            'nombre'               => $this->nombre,
            'descripcion'          => $this->descripcion,
            'cant_horas'           => $this->cant_horas,
            'inicio'               => $this->inicio?->format('Y-m-d'),
            'fin'                  => $this->fin?->format('Y-m-d'),
            'horarios'             => $this->horarios,
            'costo'                => $this->costo,
            'capacidad'            => $this->capacidad,
            'publicado'            => $this->publicado,
            'id_programa_asociado' => $this->id_programa_asociado,
            'id_proveedor'         => $this->id_proveedor,
            'habilidad'            => $this->habilidad?->habilidad ?? null,
            'categoria'            => $this->categoria?->categoria ?? null,
            'programa'             => $this->programa?->programa ?? null,
            'proveedor'            => $this->proveedor?->provedor ?? null,
            'id_cdc'               => $this->id_cdc,
            'cdc'                  => $this->cdc?->cdc ?? null,
            'modalidad'            => $this->modalidad ?? null,
            'status'               => $this->status ?? null,
            'created_at'           => $this->created_at,
        ];
    }
}
