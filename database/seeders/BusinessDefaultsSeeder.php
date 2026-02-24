<?php

namespace Database\Seeders;

use App\Models\Categoria;
use App\Models\Cdc;
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

        // CDCs (Centros de Costo)
        $cdcs = [
            'marketing', 'estrategia_comercial', 'produccion_mataderos', 'control_de_calidad',
            'servicios_tecnicos', 'estructura_planta', 'direccion_medica', 'qa',
            'desarrollo', 'business_development', 'acceso_a_ventas', 'capital_humano',
            'registros', 'oncologia_y_hematologia', 'produccion_victoria', 'compras',
            'administracion_de_ventas', 'impuestos', 'it', 'comercial_lacteos',
            'api_supply_chain', 'abastecimiento', 'control_de_gestion',
        ];
        foreach ($cdcs as $cdc) {
            Cdc::firstOrCreate(['cdc' => $cdc]);
        }

        // Categorías
        $categorias = ['gasto', 'capacitación', 'postgrado'];
        foreach ($categorias as $categoria) {
            Categoria::firstOrCreate(['categoria' => $categoria]);
        }

    }
}
