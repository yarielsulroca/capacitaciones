<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$u = App\Models\User::where('email', 'ysulroca@tuteurgroup.com')->first();
$response = $app->make(\Illuminate\Contracts\Http\Kernel::class)->handle(
    \Illuminate\Http\Request::create('/admin', 'GET', [], [], [], [
        'HTTP_X_REQUESTED_WITH' => 'XMLHttpRequest',
        'X-Inertia' => 'true'
    ])->setUserResolver(fn () => $u)
);
echo "Status: " . $response->getStatusCode() . "\n";
echo "Content: " . substr($response->getContent(), 0, 500) . "...\n";
