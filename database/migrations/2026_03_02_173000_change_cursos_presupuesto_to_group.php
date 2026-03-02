<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cursos', function (Blueprint $table) {
            // Drop existing foreign key
            $table->dropForeign(['id_presupuesto']);

            // Re-define it to point to presupuesto_grupos
            $table->foreign('id_presupuesto')->references('id')->on('presupuesto_grupos')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('cursos', function (Blueprint $table) {
            $table->dropForeign(['id_presupuesto']);
            $table->foreign('id_presupuesto')->references('id')->on('presupuestos')->onDelete('set null');
        });
    }
};
