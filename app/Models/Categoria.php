<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Categoria extends Model
{
    protected $fillable = ['categoria', 'descripcion'];

    public function cursos(): HasMany
    {
        return $this->hasMany(Curso::class, 'categoria_id');
    }
}
