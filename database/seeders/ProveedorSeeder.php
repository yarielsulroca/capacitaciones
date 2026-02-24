<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ProveedorSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $proveedores = [
            'AAEF', 'Alejandra Estrella', 'Analytical', 'ANALYTICAL', 'AQA', 'Axenfeld', 'BIOXENTYS',
            'BSK', 'Cableado Estructurado', 'Capacitarte', 'Capalbo Christian', 'CFI', 'cGMP DOC',
            'Christian Capalbo', 'CHUTRAU', 'COFyBCF', 'Consejo', 'Cooperala', 'COPIME', 'CRITERIO',
            'ERREPAR', 'Eseyka', 'Fundacion Proydesa', 'Genslab Pharmaceutical', 'i-brokers',
            'Interno', 'IRAM', 'Jenck', 'LAFTAR', 'Laura Ruz', 'Martin Lorences', 'Mercer',
            'METROQUIMICA', 'POP', 'RE-DOX', 'S&T Catering SA', 'SAFYBI', 'Siglo 21', 'TechU',
            'TERRA FARMA', 'tuprofedeingles', 'UBA', 'UTN', 'Whalecom', 'WorkAlliance', 'ZWEI',
            'Escuela de Habitat y Sustentabilidad', 'C2'
        ];

        foreach ($proveedores as $p) {
            \App\Models\Proveedor::firstOrCreate(['provedor' => $p]);
        }
    }
}
