<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cursos', function (Blueprint $table) {
            $table->unsignedBigInteger('id_presupuesto')->nullable()->after('id_cdc');
            $table->boolean('costo_cero')->default(false)->after('costo');
            $table->foreign('id_presupuesto')->references('id')->on('presupuestos')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('cursos', function (Blueprint $table) {
            $table->dropForeign(['id_presupuesto']);
            $table->dropColumn('id_presupuesto');
        });
    }
};
