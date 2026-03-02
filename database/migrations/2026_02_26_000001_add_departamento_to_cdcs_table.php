<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cdcs', function (Blueprint $table) {
            $table->foreignId('id_departamento')->nullable()->constrained('departamentos')->after('descripcion');
        });
    }

    public function down(): void
    {
        Schema::table('cdcs', function (Blueprint $table) {
            $table->dropForeign(['id_departamento']);
            $table->dropColumn('id_departamento');
        });
    }
};
