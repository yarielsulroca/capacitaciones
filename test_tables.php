<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$models = ['Empresa', 'Area', 'Departamento', 'Categoria', 'Habilidad', 'Proveedor', 'ProgramaAsociado', 'Presupuesto', 'Cdc', 'Curso'];
foreach ($models as $m) {
    $class = "\\App\\Models\\$m";
    echo $m . ": " . (new $class)->getTable() . "\n";
}
