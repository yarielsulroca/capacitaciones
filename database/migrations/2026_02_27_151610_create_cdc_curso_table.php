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
        Schema::create('cdc_curso', function (Blueprint $table) {
            $table->id();
            $table->foreignId('curso_id')->constrained('cursos')->onDelete('cascade');
            $table->foreignId('cdc_id')->constrained('cdcs')->onDelete('cascade');
            $table->decimal('monto', 15, 2)->default(0)->comment('Monto o valor que este CDC aporta al costo del curso');
            $table->timestamps();

            $table->unique(['curso_id', 'cdc_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cdc_curso');
    }
};
