<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Habilidad extends Model
{
    protected $fillable = ['habilidad', 'descripcion'];

    public function cursos(): HasMany
    {
        return $this->hasMany(Curso::class, 'habilidad_id');
    }
}
