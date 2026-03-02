<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Habilidad extends Model
{
    use SoftDeletes;
    protected $fillable = ['habilidad', 'descripcion'];

    public function cursos(): HasMany
    {
        return $this->hasMany(Curso::class, 'habilidad_id');
    }
}
