<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class PresupuestoGrupo extends Model
{
    use SoftDeletes;

    protected $table = 'presupuesto_grupos';

    protected $fillable = ['fecha', 'descripcion'];

    public function presupuestos(): HasMany
    {
        return $this->hasMany(Presupuesto::class, 'id_grupo');
    }

    public function cursosUsers(): HasMany
    {
        return $this->hasMany(CursoUser::class, 'id_presupuesto');
    }

    /**
     * Get the total initial budget for this group.
     */
    public function getTotalInicialAttribute(): float
    {
        return $this->presupuestos->sum(fn ($p) => (float) $p->inicial);
    }

    /**
     * Get the total current budget for this group.
     */
    public function getTotalActualAttribute(): float
    {
        return $this->presupuestos->sum(fn ($p) => (float) $p->actual);
    }
}
