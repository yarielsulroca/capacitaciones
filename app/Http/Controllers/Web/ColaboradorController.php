<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Http\Resources\CursoResource;
use App\Models\Curso;
use App\Models\EstadoCurso;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ColaboradorController extends Controller
{
    public function dashboard(Request $request)
    {
        $user = $request->user();

        // 1. Calculate Stats
        $stats = [
            'available' => Curso::count(),
            'solicitado' => $user->cursos()->wherePivotIn('curso_estado', EstadoCurso::where('estado', 'solicitado')->pluck('id'))->count(),
            'matriculado' => $user->cursos()->wherePivotIn('curso_estado', EstadoCurso::where('estado', 'matriculado')->pluck('id'))->count(),
            'terminado' => $user->cursos()->wherePivotIn('curso_estado', EstadoCurso::where('estado', 'terminado')->pluck('id'))->count(),
            'certificado' => $user->cursos()->wherePivotIn('curso_estado', EstadoCurso::where('estado', 'certificado')->pluck('id'))->count(),
            'incompleto' => $user->cursos()->wherePivotIn('curso_estado', EstadoCurso::where('estado', 'incompleto')->pluck('id'))->count(),
            'cancelado' => $user->cursos()->wherePivotIn('curso_estado', EstadoCurso::where('estado', 'cancelado')->pluck('id'))->count(),
        ];

        // 2. Handle Filtering or Featured
        $statusFilter = $request->query('status');

        if ($statusFilter) {
            $courses = $user->cursos()
                ->wherePivotIn('curso_estado', EstadoCurso::where('estado', $statusFilter)->pluck('id'))
                ->with(['habilidad', 'categoria'])
                ->get();

            $courses->transform(function ($curso) {
                $curso->status = EstadoCurso::find($curso->pivot->curso_estado)?->estado;

                return $curso;
            });
        } else {
            $featured = Curso::where('publicado', 1)
                ->latest()
                ->with(['habilidad', 'categoria'])
                ->take(3)
                ->get();

            $courses = $featured->map(function ($curso) use ($user) {
                $enrollment = $user->cursos()->where('id_curso', $curso->id)->first();
                $curso->status = $enrollment ? EstadoCurso::find($enrollment->pivot->curso_estado)?->estado : null;

                return $curso;
            });
        }

        return Inertia::render('colaborador/dashboard', [
            'stats' => $stats,
            'featured' => CursoResource::collection($courses),
            'activeStatus' => $statusFilter,
        ]);
    }
}
