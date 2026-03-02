<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$u = App\Models\User::where('email', 'ysulroca@tuteurgroup.com')->first();
echo "Depto: " . ($u->id_departamento ?? 'NULL') . ", Area: " . ($u->id_area ?? 'NULL') . "\n";

$logFile = storage_path('logs/laravel.log');
if (file_exists($logFile)) {
    $lines = file($logFile);
    $lastLines = array_slice($lines, -30);
    echo "\n--- LAST LOG LINES ---\n";
    foreach ($lastLines as $line) {
        if (strpos($line, 'ysulroca') !== false || strpos($line, 'Exception') !== false || strpos($line, 'Error') !== false) {
            echo $line;
        }
    }
}
