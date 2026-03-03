<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CdcSeeder extends Seeder
{
    public function run(): void
    {
        $departments = DB::table('departamentos')->get(['id', 'nombre']);

        foreach ($departments as $dept) {
            // Only create if no CDC exists for this department
            $exists = DB::table('cdcs')->where('id_departamento', $dept->id)->exists();
            if (!$exists) {
                DB::table('cdcs')->insert([
                    'cdc' => 'CDC-' . $dept->nombre,
                    'id_departamento' => $dept->id,
                    'inversion' => 0,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        $this->command->info('CDCs created: ' . DB::table('cdcs')->count());
    }
}
