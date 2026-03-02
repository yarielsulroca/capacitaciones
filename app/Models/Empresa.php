<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Empresa extends Model
{
    use HasFactory, SoftDeletes;
    protected $fillable = ['nombre', 'direccion'];

    public function areas(): HasMany
    {
        return $this->hasMany(Area::class, 'id_empresa');
    }
}
