<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('presupuestos', function (Blueprint $table) {
            // Rename existing 'presupuesto' column to 'inicial'
            $table->renameColumn('presupuesto', 'inicial');
        });

        Schema::table('presupuestos', function (Blueprint $table) {
            // Add 'actual' column (current remaining budget, mirrors 'inicial' on creation)
            $table->decimal('actual', 15, 2)->default(0)->after('inicial');
        });

        // Seed 'actual' = 'inicial' for existing rows
        \DB::statement('UPDATE presupuestos SET actual = inicial');

        // Drop id_empresa if it exists (presupuesto is now scoped to departamento)
        if (Schema::hasColumn('presupuestos', 'id_empresa')) {
            Schema::table('presupuestos', function (Blueprint $table) {
                // Drop FK constraint first
                try {
                    $table->dropForeign(['id_empresa']);
                } catch (\Exception $e) {
                    // FK may not exist under this name
                }
                $table->dropColumn('id_empresa');
            });
        }
    }

    public function down(): void
    {
        Schema::table('presupuestos', function (Blueprint $table) {
            $table->dropColumn('actual');
            $table->renameColumn('inicial', 'presupuesto');
            $table->foreignId('id_empresa')->nullable()->constrained('empresas');
        });
    }
};
