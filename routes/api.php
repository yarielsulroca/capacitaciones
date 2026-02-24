<?php

use App\Http\Controllers\Api\Admin\AdminController;
use App\Http\Controllers\Api\Admin\AreaController;
use App\Http\Controllers\Api\Admin\CategoriaController;
use App\Http\Controllers\Api\Admin\CdcController;
use App\Http\Controllers\Api\Admin\DepartamentoController;
use App\Http\Controllers\Api\Admin\EmpresaController;
use App\Http\Controllers\Api\Admin\HabilidadController;
use App\Http\Controllers\Api\Admin\ModalidadController;
use App\Http\Controllers\Api\Admin\PresupuestoController;
use App\Http\Controllers\Api\Admin\ProveedorController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CourseController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Authentication
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', function (Request $request) {
        return $request->user()->load('departamento.area.empresa');
    });

    // Course Management (Common for all roles)
    Route::get('/courses', [CourseController::class, 'index']);
    Route::get('/my-enrollments', [CourseController::class, 'myEnrollments']);
    Route::post('/courses/{curso}/enroll', [CourseController::class, 'enroll']);
    Route::post('/courses/{curso}/cancelado', [CourseController::class, 'cancel']);

    // Admin RH (Full CRUD and management)
    Route::prefix('admin')->group(function () {
        // Full CRUD Resources
        Route::apiResource('areas', AreaController::class);
        Route::apiResource('departamentos', DepartamentoController::class);
        Route::apiResource('empresas', EmpresaController::class);
        Route::apiResource('cdcs', CdcController::class);
        Route::apiResource('habilidades', HabilidadController::class);
        Route::apiResource('categorias', CategoriaController::class);
        Route::apiResource('presupuestos', PresupuestoController::class);
        Route::apiResource('proveedores', ProveedorController::class);
        Route::apiResource('modalidades', ModalidadController::class);
    });

    // Boss Groups (General and Area Bosses)
    Route::middleware('role:jefe_area,jefe_general,admin')->prefix('management')->group(function () {
        // Management specific routes
        Route::get('/area-courses', [CourseController::class, 'index']); // Filtered by area in controller usually
    });
});
