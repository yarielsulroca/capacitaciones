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
        Schema::create('capacitaciones', function (Blueprint $table) {
            $table->id();
            $table->date('mes_pago');
            $table->boolean('twiins')->nullable();
            $table->foreignId('cdc_id')->constrained('cdcs');
            $table->foreignId('is_estado_curso')->constrained('estado_curso'); // Linking to a specific state change record if needed
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('capacitaciones');
    }
};
