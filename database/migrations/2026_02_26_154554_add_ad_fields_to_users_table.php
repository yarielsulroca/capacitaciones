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
        Schema::table('users', function (Blueprint $table) {
            $table->string('pais')->nullable();
            $table->string('ciudad')->nullable();
            $table->string('oficina')->nullable();

            // Note: Since 'area' was added in a previous migration as a string, we might need a separate id_area
            $table->foreignId('id_empresa')->nullable()->constrained('empresas');
            $table->foreignId('id_area')->nullable()->constrained('areas');
            $table->foreignId('id_jefe')->nullable()->constrained('users');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['id_empresa']);
            $table->dropForeign(['id_area']);
            $table->dropForeign(['id_jefe']);
            $table->dropColumn(['pais', 'ciudad', 'oficina', 'id_empresa', 'id_area', 'id_jefe']);
        });
    }
};
