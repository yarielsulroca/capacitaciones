<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$u = App\Models\User::where('email', 'ysulroca@tuteurgroup.com')->first();
\Illuminate\Support\Facades\Auth::login($u);

$request = \Illuminate\Http\Request::create('/admin', 'GET');
$request->setLaravelSession($app['session']->driver());

$response = $app->make(\Illuminate\Contracts\Http\Kernel::class)->handle($request);
echo "Status: " . $response->getStatusCode() . "\n";
echo "Content: " . substr($response->getContent(), 0, 800) . "...\n";
