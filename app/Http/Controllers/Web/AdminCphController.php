<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Area;
use App\Models\Categoria;
use App\Models\Cdc;
use App\Models\Curso;
use App\Models\Departamento;
use App\Models\Empresa;
use App\Models\Habilidad;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdminCphController extends Controller
{
    public function dashboard()
    {
        return Inertia::render('admincph/dashboard');
    }

    public function users(Request $request)
    {
        $query = User::with('departamento.area');

        if ($request->has('area_id')) {
            $query->whereHas('departamento', fn ($q) => $q->where('id_area', $request->area_id));
        }

        if ($request->has('search')) {
            $query->where('name', 'like', '%'.$request->search.'%')
                ->orWhere('email', 'like', '%'.$request->search.'%');
        }

        return Inertia::render('admincph/users', [
            'users' => $query->paginate(20),
            'metadata' => [
                'departamentos' => Departamento::with('area')->get(),
                'roles' => ['user', 'jefe_area', 'jefe_general', 'admin'],
            ],
        ]);
    }

    public function courses(Request $request)
    {
        return Inertia::render('admincph/courses', [
            'courses' => Curso::withCount('users')->with(['habilidad', 'categoria', 'tipoCapacitacion'])->paginate(20),
            'metadata' => [
                'habilidades' => Habilidad::all(),
                'categorias' => Categoria::all(),
                'cdcs' => Cdc::all(),
            ],
        ]);
    }

    public function structure()
    {
        return Inertia::render('admincph/structure', [
            'empresas' => Empresa::all(),
            'areas' => Area::all(),
            'departamentos' => Departamento::with('area')->get(),
            'habilidades' => Habilidad::all(),
            'cdcs' => Cdc::all(),
            'categorias' => Categoria::all(),
            'proveedores' => \App\Models\Proveedor::all(),
            'programas_asociados' => \App\Models\ProgramaAsociado::all(),
            'roles' => ['user', 'jefe_area', 'jefe_general', 'admin'],
        ]);
    }
}
