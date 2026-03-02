<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CursoTipo extends Model
{
    protected $table = 'cursos_tipos';

    protected $fillable = ['tipo'];

    public function cursos(): HasMany
    {
        return $this->hasMany(Curso::class, 'id_tipo');
    }
}
