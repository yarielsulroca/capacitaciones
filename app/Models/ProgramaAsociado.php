<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProgramaAsociado extends Model
{
    protected $table = 'programas_asociados';

    protected $fillable = ['programa', 'descripcion', 'activo'];

    protected $casts = [
        'activo' => 'boolean',
    ];

    public function cursos(): HasMany
    {
        return $this->hasMany(Curso::class, 'id_programa_asociado');
    }
}
