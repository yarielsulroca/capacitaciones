<?php

namespace Database\Seeders;

use App\Models\Categoria;
use App\Models\EstadoCurso;
use App\Models\Habilidad;
use Illuminate\Database\Seeder;

class BusinessDefaultsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Estados de Curso
        $estados = [
            ['estado' => 'solicitado'],
            ['estado' => 'procesando'],
            ['estado' => 'matriculado'],
            ['estado' => 'cancelado'],
            ['estado' => 'terminado'],
            ['estado' => 'incompleto'],
            ['estado' => 'certificado'],
        ];
        foreach ($estados as $estadoData) {
            EstadoCurso::firstOrCreate($estadoData);
        }

        // Habilidades
        $habilidades = ['técnico', 'desarrollo de habilidades', "KP'Is-datos", 'idioma', 'desarrollo de equipos'];
        foreach ($habilidades as $habilidad) {
            Habilidad::firstOrCreate(['habilidad' => $habilidad]);
        }


        // Categorías
        $categorias = ['gasto', 'capacitación', 'postgrado'];
        foreach ($categorias as $categoria) {
            Categoria::firstOrCreate(['categoria' => $categoria]);
        }

    }
}
