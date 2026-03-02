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
        Schema::table('presupuestos', function (Blueprint $table) {
            $table->renameColumn('anio', 'fecha');
            $table->renameColumn('monto', 'presupuesto');
            $table->foreignId('id_departamento')->nullable()->constrained('departamentos');
        });

        // Change fecha type to date (SQLite/MySQL differences might apply, using simple change if possible)
        // For fresh dev, we might just drop and recreate if prefered, but let's try modification.
        // Actually, renaming 'anio' (integer) to 'fecha' (intended date) needs a type change.
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('presupuestos', function (Blueprint $table) {
            $table->dropForeign(['id_departamento']);
            $table->dropColumn('id_departamento');
            $table->renameColumn('fecha', 'anio');
            $table->renameColumn('presupuesto', 'monto');
        });
    }
};
