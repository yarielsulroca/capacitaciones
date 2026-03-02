<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $tables = [
            'empresas',
            'areas',
            'departamentos',
            'categorias',
            'habilidads',
            'proveedors',
            'programas_asociados',
            'presupuestos',
            'cdcs',
            'cursos',
        ];

        foreach ($tables as $table) {
            Schema::table($table, function (Blueprint $t) {
                $t->softDeletes();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $tables = [
            'empresas',
            'areas',
            'departamentos',
            'categorias',
            'habilidads',
            'proveedors',
            'programas_asociados',
            'presupuestos',
            'cdcs',
            'cursos',
        ];

        foreach ($tables as $table) {
            Schema::table($table, function (Blueprint $t) {
                $t->dropSoftDeletes();
            });
        }
    }
};
