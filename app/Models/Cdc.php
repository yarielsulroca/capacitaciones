<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Cdc extends Model
{
    use SoftDeletes;
    protected $fillable = ['cdc', 'inversion', 'descripcion', 'id_departamento'];

    public function departamento(): BelongsTo
    {
        return $this->belongsTo(Departamento::class, 'id_departamento');
    }

    public function cursos(): HasMany
    {
        return $this->hasMany(Curso::class, 'id_cdc');
    }

    /**
     * Courses funded by this CDC (many-to-many with monto).
     */
    public function cursosMany(): BelongsToMany
    {
        return $this->belongsToMany(Curso::class, 'cdc_curso', 'cdc_id', 'curso_id')
            ->withPivot('monto')
            ->withTimestamps();
    }
}
