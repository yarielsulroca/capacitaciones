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
    // Colaborador
    Route::get('dashboard', [ColaboradorController::class, 'dashboard'])->name('dashboard');
    Route::get('courses', [CourseController::class, 'index'])->name('courses.index');
    Route::get('courses/{curso}', [CourseController::class, 'show'])->name('courses.show');
    Route::post('courses/{curso}/enroll', [CourseController::class, 'enroll'])->name('courses.enroll');
    Route::post('courses/{curso}/cancelado', [CourseController::class, 'cancel'])->name('courses.cancel');

    // Admin CPH
    Route::middleware(['auth', 'verified', 'role:admin'])->prefix('admin')->group(function () {
        Route::get('/', [AdminCphController::class, 'dashboard'])->name('admin.dashboard');
        Route::get('/users', [AdminCphController::class, 'users'])->name('admin.users');
        Route::get('/courses', [AdminCphController::class, 'courses'])->name('admin.courses');
        Route::get('/structure', [AdminCphController::class, 'structure'])->name('admin.structure');

        // Course management
        Route::post('/courses', [\App\Http\Controllers\Api\Admin\AdminController::class, 'storeCourse']);
        Route::patch('/courses/{course}', [\App\Http\Controllers\Api\Admin\AdminController::class, 'updateCourse']);

        // User management (data fetch for search)
        Route::get('/users/list', [\App\Http\Controllers\Api\Admin\AdminController::class, 'users']);
        Route::post('/users', [\App\Http\Controllers\Api\Admin\AdminController::class, 'storeUser']);
        Route::patch('/users/{user}', [\App\Http\Controllers\Api\Admin\AdminController::class, 'updateUser']);

        // Resource management
        Route::post('/structure/{type}', [\App\Http\Controllers\Api\Admin\AdminController::class, 'storeResource']);
        Route::patch('/structure/{type}/{id}', [\App\Http\Controllers\Api\Admin\AdminController::class, 'updateResource']);
        Route::delete('/structure/{type}/{id}', [\App\Http\Controllers\Api\Admin\AdminController::class, 'destroyResource']);

        // Enrollment management
        Route::post('/enrollments/update-status', [\App\Http\Controllers\Api\Admin\AdminController::class, 'updateStatus']);
        Route::post('/courses/{course}/enroll-manual', [\App\Http\Controllers\Api\Admin\AdminController::class, 'enrollManual']);
        Route::get('/courses/{course}/enrollments', [\App\Http\Controllers\Api\Admin\AdminController::class, 'courseEnrollments']);
    });
});

require __DIR__.'/settings.php';
