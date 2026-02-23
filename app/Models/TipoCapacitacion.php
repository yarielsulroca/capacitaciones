<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TipoCapacitacion extends Model
{
    protected $fillable = ['nombre', 'descripcion', 'cdc_id'];

    public function cdc(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Cdc::class, 'cdc_id');
    }

    public function detalles(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(TipoCapacitacionDetalle::class, 'id_tipo_capacitacion');
    }
}
