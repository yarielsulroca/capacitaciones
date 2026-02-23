<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EstadoCurso extends Model
{
    protected $table = 'estado_curso';

    protected $fillable = ['estado'];
}
