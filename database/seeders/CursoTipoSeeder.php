<?php

namespace Database\Seeders;

use App\Models\CursoTipo;
use Illuminate\Database\Seeder;

class CursoTipoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $tipos = ['Abierto', 'A pedido'];

        foreach ($tipos as $tipo) {
            CursoTipo::updateOrCreate(['tipo' => $tipo]);
        }
    }
}
