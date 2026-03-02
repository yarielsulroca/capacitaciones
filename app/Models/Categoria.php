<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Categoria extends Model
{
    use SoftDeletes;
    protected $fillable = ['categoria', 'descripcion'];

    public function cursos(): HasMany
    {
        return $this->hasMany(Curso::class, 'categoria_id');
    }
}
