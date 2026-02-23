<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call(BusinessDefaultsSeeder::class);

        // [LDAP MODE] Users are managed via domain login
        /*
        // 1. Create Test Users for all roles
        $roles = ['admin', 'jefe_general', 'jefe_area', 'user'];
        foreach ($roles as $role) {
            \App\Models\User::factory()->create([
                'name' => 'Test ' . ucfirst($role),
                'email' => "ysulroca+{$role}@tuteurgroup.com",
                'role' => $role,
                'password' => bcrypt('password'),
            ]);
        }

        echo "Created users: ysulroca+[admin, jefe_general, jefe_area, user]@tuteurgroup.com (Password: password)\n";
        */

        // 2. Create sample courses
        $habilidad = \App\Models\Habilidad::first();
        $categoria = \App\Models\Categoria::first();

        // Course 1: Starts in 5 days (Test cancellation restriction)
        \App\Models\Curso::create([
            'nombre' => 'Excel Avanzado para Finanzas',
            'descripcion' => 'Domina las herramientas avanzadas de Excel para análisis financiero.',
            'cant_horas' => 20,
            'inicio' => now()->addDays(5)->toDateString(),
            'fin' => now()->addDays(15)->toDateString(),
            'horarios' => [['dia' => 'lunes', 'hora' => '09:00 - 11:00']],
            'costo' => 1500,
            'capacidad' => 20,
            'habilidad_id' => $habilidad->id,
            'categoria_id' => $categoria->id,
        ]);

        // Course 2: Starts in 10 days (Allowed to cancel)
        \App\Models\Curso::create([
            'nombre' => 'Liderazgo y Gestión de Equipos',
            'descripcion' => 'Habilidades blandas para futuros líderes de área.',
            'cant_horas' => 30,
            'inicio' => now()->addDays(10)->toDateString(),
            'fin' => now()->addDays(40)->toDateString(),
            'horarios' => [['dia' => 'miércoles', 'hora' => '14:00 - 17:00']],
            'costo' => 3000,
            'capacidad' => 15,
            'habilidad_id' => $habilidad->id,
            'categoria_id' => $categoria->id,
        ]);

        // Course 3: Starts in exactly 6 days (Testing immediate "Matriculado" email logic)
        \App\Models\Curso::create([
            'nombre' => 'Gestión Ágil de Proyectos (Scrum)',
            'descripcion' => 'Introducción a metodologías ágiles en el entorno corporativo.',
            'cant_horas' => 12,
            'inicio' => now()->addDays(6)->toDateString(),
            'fin' => now()->addDays(20)->toDateString(),
            'horarios' => [['dia' => 'viernes', 'hora' => '10:00 - 13:00']],
            'costo' => 2000,
            'capacidad' => 25,
            'habilidad_id' => $habilidad->id,
            'categoria_id' => $categoria->id,
        ]);
    }
}
