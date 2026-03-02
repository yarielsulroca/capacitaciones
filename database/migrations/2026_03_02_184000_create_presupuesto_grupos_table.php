<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Create presupuesto_grupos parent table
        Schema::create('presupuesto_grupos', function (Blueprint $table) {
            $table->id();
            $table->integer('fecha'); // year
            $table->string('descripcion', 500)->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // 2. Add id_grupo FK to presupuestos
        Schema::table('presupuestos', function (Blueprint $table) {
            $table->unsignedBigInteger('id_grupo')->nullable()->after('id');
            $table->foreign('id_grupo')->references('id')->on('presupuesto_grupos')->onDelete('cascade');
        });

        // 3. Migrate existing presupuestos into grupos (group by descripcion + fecha)
        $presupuestos = \DB::table('presupuestos')->whereNull('deleted_at')->get();
        $groups = $presupuestos->groupBy(function ($p) {
            return ($p->descripcion ?? 'Sin descripción') . '|' . $p->fecha;
        });

        foreach ($groups as $key => $items) {
            $first = $items->first();
            $grupoId = \DB::table('presupuesto_grupos')->insertGetId([
                'fecha'       => $first->fecha,
                'descripcion' => $first->descripcion,
                'created_at'  => now(),
                'updated_at'  => now(),
            ]);

            \DB::table('presupuestos')
                ->whereIn('id', $items->pluck('id'))
                ->update(['id_grupo' => $grupoId]);
        }
    }

    public function down(): void
    {
        Schema::table('presupuestos', function (Blueprint $table) {
            $table->dropForeign(['id_grupo']);
            $table->dropColumn('id_grupo');
        });

        Schema::dropIfExists('presupuesto_grupos');
    }
};
