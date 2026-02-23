<?php

use App\Http\Controllers\Api\CourseController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::get('dashboard', function (\Illuminate\Http\Request $request) {
    $user = auth()->user();

    // 1. Calculate Stats (Using names from join to avoid ID hardcoding issues)
    $stats = [
        'available' => \App\Models\Curso::count(),
        'solicitado' => $user->cursos()->wherePivotIn('curso_estado', \App\Models\EstadoCurso::where('estado', 'solicitado')->pluck('id'))->count(),
        'matriculado' => $user->cursos()->wherePivotIn('curso_estado', \App\Models\EstadoCurso::where('estado', 'matriculado')->pluck('id'))->count(),
        'terminado' => $user->cursos()->wherePivotIn('curso_estado', \App\Models\EstadoCurso::where('estado', 'terminado')->pluck('id'))->count(),
        'certificado' => $user->cursos()->wherePivotIn('curso_estado', \App\Models\EstadoCurso::where('estado', 'certificado')->pluck('id'))->count(),
        'incompleto' => $user->cursos()->wherePivotIn('curso_estado', \App\Models\EstadoCurso::where('estado', 'incompleto')->pluck('id'))->count(),
        'cancelado' => $user->cursos()->wherePivotIn('curso_estado', \App\Models\EstadoCurso::where('estado', 'cancelado')->pluck('id'))->count(),
    ];

    // 2. Handle Filtering or Featured
    $statusFilter = $request->query('status');

    if ($statusFilter) {
        $courses = $user->cursos()
            ->wherePivotIn('curso_estado', \App\Models\EstadoCurso::where('estado', $statusFilter)->pluck('id'))
            ->with(['habilidad', 'categoria'])
            ->get();

        $courses->transform(function($curso) {
            $curso->status = \App\Models\EstadoCurso::find($curso->pivot->curso_estado)?->estado;
            return $curso;
        });
    } else {
        $featured = \App\Models\Curso::latest()
            ->with(['habilidad', 'categoria'])
            ->take(3)
            ->get();

        $courses = $featured->map(function ($curso) use ($user) {
            $enrollment = $user->cursos()->where('id_curso', $curso->id)->first();
            $curso->status = $enrollment ? \App\Models\EstadoCurso::find($enrollment->pivot->curso_estado)?->estado : null;
            return $curso;
        });
    }

    return Inertia::render('dashboard', [
        'stats' => $stats,
        'featured' => \App\Http\Resources\CursoResource::collection($courses),
        'activeStatus' => $statusFilter
    ]);
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('courses', [CourseController::class, 'index'])->name('courses.index');
    Route::get('courses/{curso}', [CourseController::class, 'show'])->name('courses.show');
    Route::post('courses/{curso}/enroll', [CourseController::class, 'enroll'])->name('courses.enroll');
    Route::post('courses/{curso}/cancelado', [CourseController::class, 'cancel'])->name('courses.cancel');
});

require __DIR__.'/settings.php';
