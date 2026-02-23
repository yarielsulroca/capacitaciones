<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

try {
    echo "Running BusinessDefaultsSeeder...\n";
    (new Database\Seeders\BusinessDefaultsSeeder())->run();
    echo "BusinessDefaultsSeeder SUCCESS\n";

    echo "Running DatabaseSeeder custom part...\n";

    // Create Test Admin
    $admin = \App\Models\User::firstOrCreate(
        ['email' => 'admin@tuteur.com'],
        ['name' => 'Admin RH', 'role' => 'admin', 'password' => bcrypt('password')]
    );
    echo "Admin created\n";

    $habilidad = \App\Models\Habilidad::first();
    $cdc = \App\Models\Cdc::first();
    $categoria = \App\Models\Categoria::first();
    $programa = \App\Models\ProgramaAsociado::first();

    \App\Models\Curso::create([
        'nombre' => 'Debug Course',
        'descripcion' => 'Test',
        'cant_horas' => 20,
        'inicio' => date('Y-m-d'),
        'fin' => date('Y-m-d'),
        'horarios' => [['dia' => 'lunes', 'hora' => '09:00']],
        'costo' => 1000,
        'capacidad' => 10,
        'habilidad_id' => $habilidad->id,
        'cdc_id' => $cdc->id,
        'categoria_id' => $categoria->id,
        'prog_asociado_id' => $programa->id,
    ]);
    echo "Course created\n";

} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString();
}
