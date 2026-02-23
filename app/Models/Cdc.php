<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Cdc extends Model
{
    protected $fillable = ['cdc', 'descripcion'];

    public function cursos(): HasMany
    {
        return $this->hasMany(Curso::class, 'cdc_id');
    }
}
