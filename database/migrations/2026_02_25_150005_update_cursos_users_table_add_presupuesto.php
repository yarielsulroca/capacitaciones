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
        Schema::table('cursos_users', function (Blueprint $table) {
            $table->foreignId('id_presupuesto')->nullable()->constrained('presupuestos');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cursos_users', function (Blueprint $table) {
            $table->dropForeign(['id_presupuesto']);
            $table->dropColumn('id_presupuesto');
        });
    }
};
