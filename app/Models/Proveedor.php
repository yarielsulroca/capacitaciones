<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Proveedor extends Model
{
    protected $fillable = ['provedor', 'contacto', 'telefono', 'email', 'descripcion'];

    public function cursos(): HasMany
    {
        return $this->hasMany(Curso::class, 'id_proveedor');
    }
}
