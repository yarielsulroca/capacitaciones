<?php

use App\Http\Controllers\Web\AdminCphController;
use App\Http\Controllers\Web\ColaboradorController;
use App\Http\Controllers\Web\CourseController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    // Colaborador — default views
    Route::get('dashboard', [ColaboradorController::class, 'dashboard'])->name('dashboard');

    // Courses catalog — requires view access
    Route::middleware('view.access:courses')->group(function () {
        Route::get('courses', [CourseController::class, 'index'])->name('courses.index');
        Route::get('courses/{curso}', [CourseController::class, 'show'])->name('courses.show');
        Route::post('courses/{curso}/enroll', [CourseController::class, 'enroll'])->name('courses.enroll');
        Route::post('courses/{curso}/cancelado', [CourseController::class, 'cancel'])->name('courses.cancel');
    });

    // Admin CPH — each view protected individually
    Route::prefix('admin')->group(function () {
        Route::get('/', [AdminCphController::class, 'dashboard'])->middleware('view.access:admin.dashboard')->name('admin.dashboard');
        Route::get('/users', [AdminCphController::class, 'users'])->middleware('view.access:admin.users')->name('admin.users');
        Route::get('/courses', [AdminCphController::class, 'courses'])->middleware('view.access:admin.courses')->name('admin.courses');
        Route::get('/structure', [AdminCphController::class, 'structure'])->middleware('view.access:admin.structure')->name('admin.structure');
        Route::get('/metrics', [AdminCphController::class, 'metrics'])->middleware('view.access:admin.metrics')->name('admin.metrics');

        // Course management
        Route::post('/courses', [\App\Http\Controllers\Api\Admin\AdminController::class, 'storeCourse']);
        Route::patch('/courses/{course}', [\App\Http\Controllers\Api\Admin\AdminController::class, 'updateCourse']);
        Route::delete('/courses/{course}', [\App\Http\Controllers\Api\Admin\AdminController::class, 'destroyCourse']);

        // User management (data fetch for search)
        Route::get('/users/list', [\App\Http\Controllers\Api\Admin\AdminController::class, 'users']);
        Route::post('/users', [\App\Http\Controllers\Api\Admin\AdminController::class, 'storeUser']);
        Route::post('/users/sync-ad', [\App\Http\Controllers\Api\Admin\AdminController::class, 'syncActiveDirectory']);
        Route::patch('/users/{user}', [\App\Http\Controllers\Api\Admin\AdminController::class, 'updateUser']);

        // User view permissions management
        Route::get('/users/{user}/views', [\App\Http\Controllers\Api\Admin\AdminController::class, 'getUserViews']);
        Route::post('/users/{user}/views', [\App\Http\Controllers\Api\Admin\AdminController::class, 'updateUserViews']);

        // Resource management (structure tabs: empresas, areas, departamentos, cdcs, categorias, habilidades, proveedores, programas_asociados, presupuestos, cursos)
        Route::post('/structure/{type}', [\App\Http\Controllers\Api\Admin\AdminController::class, 'storeResource']);
        Route::patch('/structure/{type}/{id}', [\App\Http\Controllers\Api\Admin\AdminController::class, 'updateResource']);
        Route::delete('/structure/{type}/{id}', [\App\Http\Controllers\Api\Admin\AdminController::class, 'destroyResource']);

        // Enrollment management
        Route::post('/enrollments/update-status', [\App\Http\Controllers\Api\Admin\AdminController::class, 'updateStatus']);
        Route::post('/enrollments/reject', [\App\Http\Controllers\Api\Admin\AdminController::class, 'rejectEnrollment']);
        Route::post('/courses/{course}/enroll-manual', [\App\Http\Controllers\Api\Admin\AdminController::class, 'enrollManual']);
        Route::get('/courses/{course}/enrollments', [\App\Http\Controllers\Api\Admin\AdminController::class, 'courseEnrollments']);
        Route::delete('/enrollments/{id}', [\App\Http\Controllers\Api\Admin\AdminController::class, 'destroyEnrollment']);
    });
});

require __DIR__.'/settings.php';
