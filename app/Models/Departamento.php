<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Departamento extends Model
{
    use SoftDeletes;
    protected $fillable = ['nombre', 'descripcion', 'id_area'];

    public function area(): BelongsTo
    {
        return $this->belongsTo(Area::class, 'id_area');
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'id_departamento');
    }

    public function presupuestos(): HasMany
    {
        return $this->hasMany(Presupuesto::class, 'id_departamento');
    }

    public function cdcs(): HasMany
    {
        return $this->hasMany(Cdc::class, 'id_departamento');
    }
}
