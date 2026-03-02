<?php

namespace Database\Seeders;

use App\Models\Modalidad;
use Illuminate\Database\Seeder;

class ModalidadSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $modalidades = ['Presencial', 'Virtual'];

        foreach ($modalidades as $modalidad) {
            Modalidad::updateOrCreate(['modalidad' => $modalidad]);
        }
    }
}
