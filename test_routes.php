<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$u = App\Models\User::where('email', 'ysulroca@tuteurgroup.com')->first();
\Illuminate\Support\Facades\Auth::login($u);

$routes = ['/admin', '/admin/users', '/admin/courses', '/admin/structure'];

foreach($routes as $r) {
    try {
        $request = \Illuminate\Http\Request::create($r, 'GET');
        $request->setLaravelSession($app['session']->driver());
        $response = $app->make(\Illuminate\Contracts\Http\Kernel::class)->handle($request);
        echo "Route: $r - Status: " . $response->getStatusCode() . "\n";
        if ($response->getStatusCode() >= 400) {
            echo "Body: " . substr($response->getContent(), 0, 500) . "\n";
        }
    } catch (\Exception $e) {
        echo "Route: $r - Exception: " . $e->getMessage() . "\n";
    }
}
