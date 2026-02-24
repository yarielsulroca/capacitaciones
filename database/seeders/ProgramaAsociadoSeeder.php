<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ProgramaAsociadoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        \App\Models\ProgramaAsociado::create([
            'programa' => 'Programa abierto 2025',
            'descripcion' => 'Desarrollo de habilidades generales para el año 2025',
        ]);

        \App\Models\ProgramaAsociado::create([
            'programa' => 'Programa lideres 2025',
            'descripcion' => 'Capacitación exclusiva para el desarrollo de liderazgo en Tuteur',
        ]);

        \App\Models\ProgramaAsociado::create([
            'programa' => 'Programa abierto 2026',
            'descripcion' => 'Planificación anticipada para el ciclo académico 2026',
        ]);
    }
}
