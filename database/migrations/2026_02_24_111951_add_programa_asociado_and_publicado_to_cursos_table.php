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
            $table->foreignId('id_programa_asociado')->nullable()->constrained('programas_asociados')->after('categoria_id');
            $table->boolean('publicado')->default(1)->after('id_programa_asociado');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cursos', function (Blueprint $table) {
            $table->dropForeign(['id_programa_asociado']);
            $table->dropColumn(['id_programa_asociado', 'publicado']);
        });
    }
};
