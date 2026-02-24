<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

Schema::table('users', function (Blueprint $table) {
    echo "Checking users table...\n";
    if (Schema::hasColumn('users', 'id_departamento')) {
        echo "Dropping id_departamento constraint and column...\n";
        try {
            $table->dropForeign(['id_departamento']);
        } catch (\Exception $e) {
            echo 'Warning: Could not drop foreign key (might already be gone): '.$e->getMessage()."\n";
        }
        $table->dropColumn(['id_departamento']);
        echo "Success.\n";
    } else {
        echo "id_departamento column not found.\n";
    }

    if (Schema::hasColumn('users', 'role')) {
        echo "Dropping role column...\n";
        $table->dropColumn(['role']);
        echo "Success.\n";
    }
});
