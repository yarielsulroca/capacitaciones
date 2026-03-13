<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_views', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('view_key'); // e.g. 'admin.courses', 'courses', 'admin.users'
            $table->timestamps();
            $table->unique(['user_id', 'view_key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_views');
    }
};
