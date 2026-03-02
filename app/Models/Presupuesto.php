<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Presupuesto extends Model
{
    use SoftDeletes;
    protected $fillable = ['fecha', 'inicial', 'actual', 'id_departamento', 'descripcion', 'id_grupo'];

    protected $casts = [
        'inicial' => 'decimal:2',
        'actual'  => 'decimal:2',
    ];

    public function grupo(): BelongsTo
    {
        return $this->belongsTo(PresupuestoGrupo::class, 'id_grupo');
    }

    public function departamento(): BelongsTo
    {
        return $this->belongsTo(Departamento::class, 'id_departamento');
    }

    /**
     * Deduce the given amount from the current budget.
     * Returns false if the deduction would leave the budget negative.
     */
    public function deduct(float $amount): bool
    {
        if (($this->actual - $amount) < 0) {
            return false;
        }
        $this->actual = round($this->actual - $amount, 2);
        $this->save();
        return true;
    }

    /**
     * Restore a previously deducted amount back to the budget.
     */
    public function restore(float $amount): void
    {
        $this->actual = round($this->actual + $amount, 2);
        $this->save();
    }
}
