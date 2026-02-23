<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('id_departamento')->nullable()->constrained('departamentos');
            $table->enum('role', ['user', 'jefe_area', 'jefe_general', 'admin'])->default('user');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['id_departamento']);

            // SQL Server specific: Drop check constraints on 'role' before dropping the column
            if (config('database.default') === 'sqlsrv') {
                $constraints = DB::select("
                    SELECT name FROM sys.check_constraints
                    WHERE parent_object_id = OBJECT_ID('users')
                    AND parent_column_id = COLUMNPROPERTY(OBJECT_ID('users'), 'role', 'ColumnId')
                ");
                foreach ($constraints as $constraint) {
                    DB::statement("ALTER TABLE users DROP CONSTRAINT [{$constraint->name}]");
                }
            }

            $table->dropColumn(['id_departamento', 'role']);
        });
    }
};
