<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProgramaAsociado extends Model
{
    protected $table = 'programas_asociados';
    protected $fillable = ['nombre'];

    public function cursos(): HasMany
    {
        return $this->hasMany(Curso::class, 'prog_asociado_id');
    }
}
