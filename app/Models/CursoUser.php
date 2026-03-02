<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

class CursoUser extends Pivot
{
    protected $table = 'cursos_users';

    public $incrementing = true;

    protected $fillable = [
        'id_user',
        'id_curso',
        'curso_estado',
        'id_user_mod',
        'id_presupuesto'
    ];

    protected $appends = ['status_label'];

    public function getStatusLabelAttribute()
    {
        return \App\Models\EstadoCurso::find($this->curso_estado)?->estado ?? 'solicitado';
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'id_user');
    }

    public function curso()
    {
        return $this->belongsTo(Curso::class, 'id_curso');
    }

    public function presupuesto()
    {
        return $this->belongsTo(PresupuestoGrupo::class, 'id_presupuesto');
    }
}
