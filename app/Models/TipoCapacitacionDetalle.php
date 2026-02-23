<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TipoCapacitacionDetalle extends Model
{
    protected $fillable = ['nombre', 'id_tipo_capacitacion'];

    public function tipoCapacitacion(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(TipoCapacitacion::class, 'id_tipo_capacitacion');
    }
}
