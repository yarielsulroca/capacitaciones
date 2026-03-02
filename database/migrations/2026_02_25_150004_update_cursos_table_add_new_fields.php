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
        Schema::table('cursos', function (Blueprint $table) {
            $table->foreignId('id_cdc')->nullable()->constrained('cdcs');
            $table->foreignId('id_modalidad')->nullable()->constrained('modalidads');
            $table->foreignId('id_tipo')->nullable()->constrained('cursos_tipos');
            $table->string('mes_pago')->nullable();
            $table->boolean('twiins')->default(false);
            $table->string('jornadas')->nullable();
            $table->boolean('certificado')->default(false);
            $table->integer('anio_formacion')->nullable();
            $table->string('mes_formacion')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cursos', function (Blueprint $table) {
            $table->dropForeign(['id_cdc']);
            $table->dropForeign(['id_modalidad']);
            $table->dropForeign(['id_tipo']);
            $table->dropColumn([
                'id_cdc',
                'id_modalidad',
                'id_tipo',
                'mes_pago',
                'twiins',
                'jornadas',
                'certificado',
                'anio_formacion',
                'mes_formacion'
            ]);
        });
    }
};
