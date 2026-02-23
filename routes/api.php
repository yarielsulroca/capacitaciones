<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CourseController;
use App\Http\Controllers\Api\AreaController;
use App\Http\Controllers\Api\DepartamentoController;
use App\Http\Controllers\Api\EmpresaController;
use App\Http\Controllers\Api\CdcController;
use App\Http\Controllers\Api\HabilidadController;
use App\Http\Controllers\Api\CategoriaController;
use App\Http\Controllers\Api\PresupuestoController;
use App\Http\Controllers\Api\ProveedorController;
use App\Http\Controllers\Api\ModalidadController;
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
    Route::middleware('role:admin')->prefix('admin')->group(function () {
        Route::get('/metadata', [AdminController::class, 'metadata']);
        Route::get('/users', [AdminController::class, 'users']);
        Route::get('/courses', [AdminController::class, 'courses']);
        Route::post('/enrollments/update-status', [AdminController::class, 'updateStatus']);

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
