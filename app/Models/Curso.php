<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Curso extends Model
{
    protected $fillable = [
        'nombre',
        'descripcion',
        'cant_horas',
        'inicio',
        'fin',
        'horarios',
        'costo',
        'capacidad',
        'habilidad_id',
        'categoria_id',
        'id_programa_asociado',
        'id_proveedor',
        'publicado',
    ];

    protected $casts = [
        'horarios' => 'array',
        'inicio' => 'date',
        'fin' => 'date',
        'costo' => 'decimal:2',
        'cant_horas' => 'decimal:2',
        'publicado' => 'boolean',
    ];

    public function habilidad(): BelongsTo
    {
        return $this->belongsTo(Habilidad::class, 'habilidad_id');
    }

    public function categoria(): BelongsTo
    {
        return $this->belongsTo(Categoria::class, 'categoria_id');
    }

    public function tipoCapacitacion(): BelongsTo
    {
        return $this->belongsTo(TipoCapacitacion::class, 'id_tipo_capacitacion');
    }

    public function cdc(): BelongsTo
    {
        return $this->belongsTo(Cdc::class, 'id_cdc');
    }

    public function programa(): BelongsTo
    {
        return $this->belongsTo(ProgramaAsociado::class, 'id_programa_asociado');
    }

    public function proveedor(): BelongsTo
    {
        return $this->belongsTo(Proveedor::class, 'id_proveedor');
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'cursos_users', 'id_curso', 'id_user')
            ->withPivot('id', 'curso_estado', 'id_user_mod')
            ->withTimestamps();
    }
}
