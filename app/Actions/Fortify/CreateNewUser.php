<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Models\User;
use Illuminate\Support\Facades\Validator;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules, ProfileValidationRules;

    protected $ldap;

    public function __construct(\App\Services\LdapService $ldap)
    {
        $this->ldap = $ldap;
    }

    /**
     * Validate and create a newly registered user.
     *
     * @param  array<string, string>  $input
     */
    public function create(array $input): User
    {
        $ldapAttributes = [];

        Validator::make($input, [
            'email' => ['required', 'string', 'email', 'max:255', \Illuminate\Validation\Rule::unique(User::class)],
            'password' => $this->passwordRules(),
        ])->after(function ($validator) use (&$input, &$ldapAttributes) {
            // [LDAP VALIDATION]
            $username = explode('@', $input['email'])[0];
            $ldapUser = $this->ldap->authenticate($username, $input['password']);

            if (!$ldapUser) {
                $validator->errors()->add('email', 'Las credenciales no coinciden con los registros del dominio.');
            } else {
                $ldapAttributes = $this->ldap->getAttributes($ldapUser);
            }
        })->validate();

        // Fetch attributes or defaults
        $ldapAttributes = $ldapAttributes ?: [];
        $areaName = $ldapAttributes['area'] ?? 'General';
        $deptName = $ldapAttributes['department'] ?? 'General';
        $userName = $ldapAttributes['name'] ?? explode('@', $input['email'])[0];

        // Persist Hierarchy (Empresa -> Area -> Department)
        $empresa = \App\Models\Empresa::firstOrCreate(['nombre' => 'Tuteur']);
        $area = \App\Models\Area::firstOrCreate([
            'nombre' => $areaName,
            'id_empresa' => $empresa->id
        ]);
        $dept = \App\Models\Departamento::firstOrCreate([
            'nombre' => $deptName,
            'id_area' => $area->id
        ]);

        return User::create([
            'name' => $userName,
            'email' => $input['email'],
            'password' => \Illuminate\Support\Facades\Hash::make(\Illuminate\Support\Str::random(40)),
            'id_departamento' => $dept->id,
            'cargo' => $ldapAttributes['title'] ?? null,
            'area' => $areaName,
            'role' => 'user',
        ]);
    }
}
