<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Area;
use App\Models\Departamento;
use App\Models\Empresa;
use App\Models\User;
use App\Services\LdapService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function __construct(
        protected LdapService $ldapService
    ) {}

    /**
     * Handle LDAP Login
     */
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'username' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        $ldapEntry = $this->ldapService->authenticate($credentials['username'], $credentials['password']);

        if (! $ldapEntry) {
            return response()->json(['message' => 'Credenciales invalidas.'], 401);
        }

        $attributes = $this->ldapService->getAttributes($ldapEntry);

        // Sync local user
        $user = $this->syncUser($credentials['username'], $attributes);

        Auth::login($user);

        return response()->json([
            'user' => $user->load('departamento.area.empresa'),
            'token' => $user->createToken('auth_token')->plainTextToken,
        ]);
    }

    protected function syncUser(string $username, array $attributes): User
    {
        // Find or create organizational structure
        $empresa = Empresa::firstOrCreate(['nombre' => 'Tuteur Group']); // Default for now

        $area = Area::firstOrCreate([
            'nombre' => $attributes['area'] ?? 'General',
            'id_empresa' => $empresa->id,
        ]);

        $dept = Departamento::firstOrCreate([
            'nombre' => $attributes['department'] ?? 'General',
            'id_area' => $area->id,
        ]);

        // Sync User
        return User::updateOrCreate(
            ['name' => $username],
            [
                'email' => $attributes['email'],
                'id_departamento' => $dept->id,
                'password' => Hash::make(Str::random(32)), // Placeholder
            ]
        );
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Sesion cerrada.']);
    }
}
