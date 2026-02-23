<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Capacitacion extends Model
{
    protected $fillable = ['mes_pago', 'twiins', 'cdc_id', 'is_estado_curso'];

    protected $casts = [
        'mes_pago' => 'date',
        'twiins' => 'boolean',
    ];

    public function cdc(): BelongsTo
    {
        return $this->belongsTo(Cdc::class, 'cdc_id');
    }

    public function estadoCurso(): BelongsTo
    {
        return $this->belongsTo(EstadoCurso::class, 'is_estado_curso');
    }
}
