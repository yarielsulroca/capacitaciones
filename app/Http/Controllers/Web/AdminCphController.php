<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Area;
use App\Models\Categoria;
use App\Models\Cdc;
use App\Models\Departamento;
use App\Models\Empresa;
use App\Models\Habilidad;
use App\Models\Presupuesto;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdminCphController extends Controller
{
    public function dashboard()
    {
        return Inertia::render('admincph/dashboard', [
            'stats' => [
                'users'          => User::whereNotNull('id_departamento')->whereNotNull('cargo')->where('cargo', '!=', '')->count(),
                'cursos'         => \App\Models\Curso::count(),
                'empresas'       => Empresa::count(),
                'areas'          => Area::count(),
                'departamentos'  => Departamento::count(),
            ],
        ]);
    }

    public function users(Request $request)
    {
        $query = User::with(['departamento.area', 'empresa', 'areaRel', 'jefe']);

        if ($request->has('area_id') && $request->area_id) {
            $query->whereHas('departamento', fn ($q) => $q->where('id_area', $request->area_id));
        }

        if ($request->has('departamento_id') && $request->departamento_id) {
            $query->where('id_departamento', $request->departamento_id);
        }

        if ($request->has('jefe_id') && $request->jefe_id) {
            $query->where('id_jefe', $request->jefe_id);
        }

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%'.$search.'%')
                  ->orWhere('email', 'like', '%'.$search.'%');
            });
        }

        // Separate users with incomplete data (missing departamento or cargo)
        $usersWithErrors = User::with(['departamento.area', 'empresa', 'areaRel'])
            ->where(function ($q) {
                $q->whereNull('id_departamento')
                  ->orWhereNull('cargo')
                  ->orWhere('cargo', '');
            })
            ->orderBy('name')
            ->get()
            ->map(fn ($u) => [
                'id'    => $u->id,
                'name'  => $u->name,
                'email' => $u->email,
                'reason' => collect([
                    !$u->id_departamento ? 'departamento' : null,
                    (!$u->cargo || $u->cargo === '') ? 'cargo' : null,
                ])->filter()->implode(', '),
            ]);

        // Only show valid collaborators (with departamento AND cargo)
        $query->whereNotNull('id_departamento')
              ->whereNotNull('cargo')
              ->where('cargo', '!=', '');

        // Get distinct jefes from valid users
        $jefes = User::select('id', 'name')
            ->whereIn('id', User::whereNotNull('id_jefe')->distinct()->pluck('id_jefe'))
            ->orderBy('name')
            ->get();

        return Inertia::render('admincph/users', [
            'users' => ['data' => $query->orderBy('name')->get()],
            'usersWithErrors' => $usersWithErrors,
            'metadata' => [
                'departamentos' => Departamento::with('area')->get(),
                'areas' => \App\Models\Area::orderBy('nombre')->get(),
                'jefes' => $jefes,
                'roles' => ['user', 'jefe_area', 'jefe_general', 'admin'],
            ],
        ]);
    }

    public function courses(Request $request)
    {
        // Load all cursos with their multi-CDC entries, enrolled users (with department), and metadata
        $cursos = \App\Models\Curso::with([
            'cdcs.departamento.area',
            'users.departamento.area',
            'habilidad',
            'categoria',
            'tipo',
            'modalidad',
            'proveedor',
            'programa',
        ])
            ->withCount('users')
            ->orderBy('inicio', 'desc')
            ->get();

        // Load all presupuestos for current year to show budget info
        $presupuestos = Presupuesto::with('departamento.area')
            ->where('fecha', now()->year)
            ->get();

        // Also load enrollments for backward compat (the existing flat table)
        $enrollments = \App\Models\CursoUser::with([
            'user.departamento.area',
            'curso.habilidad',
            'curso.categoria',
            'curso.tipo',
            'curso.modalidad',
            'curso.cdcs.departamento.area',
            'presupuesto',
        ])
            ->latest()
            ->paginate(20);

        return Inertia::render('admincph/courses', [
            'cursos'       => $cursos,
            'enrollments'  => $enrollments,
            'presupuestos' => $presupuestos,
            'metadata' => [
                'habilidades'  => Habilidad::all(),
                'categorias'   => Categoria::all(),
                'areas'        => \App\Models\Area::all(),
                'departamentos' => \App\Models\Departamento::with('area')->get(),
                'cdcs'         => Cdc::with('departamento.area')->get(),
                'proveedores'  => \App\Models\Proveedor::all(),
                'modalidades'  => \App\Models\Modalidad::all(),
                'cursos_tipos' => \App\Models\CursoTipo::all(),
                'users'        => User::with('departamento.area')->get(),
                'presupuestos' => \App\Models\PresupuestoGrupo::with('presupuestos')->orderBy('fecha', 'desc')->get(),
            ],
        ]);
    }

    public function structure()
    {
        return Inertia::render('admincph/structure', [
            'empresas'            => Empresa::all(),
            'areas'               => Area::all(),
            'departamentos'       => Departamento::with('area')->get(),
            'habilidades'         => Habilidad::all(),
            'cdcs'                => Cdc::with('departamento.area')->get(),
            'categorias'          => Categoria::all(),
            'proveedores'         => \App\Models\Proveedor::all(),
            'programas_asociados' => \App\Models\ProgramaAsociado::all(),
            'roles'               => ['user', 'jefe_area', 'jefe_general', 'admin'],
            'presupuestos'        => \App\Models\PresupuestoGrupo::with('presupuestos.departamento.area')
                                    ->orderBy('fecha', 'desc')
                                    ->get()
                                    ->map(function ($grupo) {
                                        return [
                                            'id'          => $grupo->id,
                                            'fecha'       => $grupo->fecha,
                                            'descripcion' => $grupo->descripcion,
                                            'total_inicial' => $grupo->total_inicial,
                                            'total_actual'  => $grupo->total_actual,
                                            'items'       => $grupo->presupuestos->map(function ($p) {
                                                return [
                                                    'id'             => $p->id,
                                                    'inicial'        => $p->inicial,
                                                    'actual'         => $p->actual,
                                                    'departamento'   => $p->departamento ? [
                                                        'id'     => $p->departamento->id,
                                                        'nombre' => $p->departamento->nombre,
                                                        'area'   => $p->departamento->area ? [
                                                            'id'     => $p->departamento->area->id,
                                                            'nombre' => $p->departamento->area->nombre,
                                                        ] : null,
                                                    ] : null,
                                                ];
                                            }),
                                        ];
                                    }),
            'cursos'              => \App\Models\Curso::with([
                'habilidad',
                'categoria',
                'cdc.departamento.area',
                'modalidad',
                'tipo',
                'proveedor',
                'programa',
            ])->orderBy('inicio', 'desc')->get(),
            'cursos_tipos'        => \App\Models\CursoTipo::all(),
            'modalidades'         => \App\Models\Modalidad::all(),
        ]);
    }

    public function metrics()
    {
        $cursos = \App\Models\Curso::with([
            'cdcs.departamento.area',
            'users.departamento.area',
            'habilidad',
            'categoria',
            'tipo',
            'modalidad',
            'proveedor',
        ])
            ->withCount('users')
            ->orderBy('inicio', 'desc')
            ->get();

        $presupuestoGrupos = \App\Models\PresupuestoGrupo::with('presupuestos.departamento.area')
            ->orderBy('fecha', 'desc')
            ->get();

        return Inertia::render('admincph/metrics', [
            'cursos'       => $cursos,
            'presupuestoGrupos' => $presupuestoGrupos,
            'areas'        => Area::all(),
            'departamentos' => Departamento::with('area')->get(),
            'habilidades'  => \App\Models\Habilidad::all(),
            'categorias'   => \App\Models\Categoria::all(),
            'users'        => User::with('departamento.area')->whereNotNull('id_departamento')->count(),
            'stats' => [
                'totalCursos'     => $cursos->count(),
                'totalInscritos'  => $cursos->sum('users_count'),
                'totalCosto'      => $cursos->sum('costo'),
                'totalPresupuesto' => $presupuestoGrupos->flatMap->presupuestos->sum('inicial'),
                'totalGastado'    => $presupuestoGrupos->flatMap->presupuestos->sum('inicial') - $presupuestoGrupos->flatMap->presupuestos->sum('actual'),
            ],
        ]);
    }
}
