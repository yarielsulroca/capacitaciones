<?php

namespace App\Providers;

use App\Actions\Fortify\CreateNewUser;
use App\Actions\Fortify\ResetUserPassword;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use Laravel\Fortify\Fortify;

class FortifyServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureActions();
        $this->configureViews();
        $this->configureRateLimiting();

        Fortify::authenticateUsing(function (Request $request) {
            $ldap = app(\App\Services\LdapService::class);
            $email = $request->email;
            $password = $request->password;

            $username = explode('@', $email)[0];
            $ldapUser = $ldap->authenticate($username, $password);

            if ($ldapUser) {
                $attributes = $ldap->getAttributes($ldapUser);

                // Find or update user
                $user = \App\Models\User::where('email', $email)->first();

                if (!$user) {
                    // This handles cases where user exists in LDAP but wasn't registered in DB
                    $empresa = \App\Models\Empresa::firstOrCreate(['nombre' => 'Tuteur']);
                    $area = \App\Models\Area::firstOrCreate([
                        'nombre' => $attributes['area'] ?? 'General',
                        'id_empresa' => $empresa->id
                    ]);
                    $dept = \App\Models\Departamento::firstOrCreate([
                        'nombre' => $attributes['department'] ?? 'General',
                        'id_area' => $area->id
                    ]);

                    $user = \App\Models\User::create([
                        'name' => $attributes['name'] ?? $username,
                        'email' => $email,
                        'password' => \Illuminate\Support\Facades\Hash::make(\Illuminate\Support\Str::random(40)),
                        'id_departamento' => $dept->id,
                        'cargo' => $attributes['title'] ?? null,
                        'area' => $attributes['area'] ?? 'General',
                        'role' => 'user',
                    ]);
                } else {
                    // Update attributes on every login to keep them fresh
                    $user->update([
                        'name' => $attributes['name'] ?? $user->name,
                        'cargo' => $attributes['title'] ?? $user->cargo,
                        'area' => $attributes['area'] ?? $user->area,
                    ]);
                }

                return $user;
            }

            return null;
        });
    }

    /**
     * Configure Fortify actions.
     */
    private function configureActions(): void
    {
        Fortify::resetUserPasswordsUsing(ResetUserPassword::class);
        Fortify::createUsersUsing(CreateNewUser::class);
    }

    /**
     * Configure Fortify views.
     */
    private function configureViews(): void
    {
        Fortify::loginView(fn (Request $request) => Inertia::render('auth/login', [
            'canResetPassword' => Features::enabled(Features::resetPasswords()),
            'canRegister' => Features::enabled(Features::registration()),
            'status' => $request->session()->get('status'),
        ]));

        Fortify::resetPasswordView(fn (Request $request) => Inertia::render('auth/reset-password', [
            'email' => $request->email,
            'token' => $request->route('token'),
        ]));

        Fortify::requestPasswordResetLinkView(fn (Request $request) => Inertia::render('auth/forgot-password', [
            'status' => $request->session()->get('status'),
        ]));

        Fortify::verifyEmailView(fn (Request $request) => Inertia::render('auth/verify-email', [
            'status' => $request->session()->get('status'),
        ]));

        Fortify::registerView(fn () => Inertia::render('auth/register'));

        Fortify::twoFactorChallengeView(fn () => Inertia::render('auth/two-factor-challenge'));

        Fortify::confirmPasswordView(fn () => Inertia::render('auth/confirm-password'));
    }

    /**
     * Configure rate limiting.
     */
    private function configureRateLimiting(): void
    {
        RateLimiter::for('two-factor', function (Request $request) {
            return Limit::perMinute(5)->by($request->session()->get('login.id'));
        });

        RateLimiter::for('login', function (Request $request) {
            $throttleKey = Str::transliterate(Str::lower($request->input(Fortify::username())).'|'.$request->ip());

            return Limit::perMinute(5)->by($throttleKey);
        });
    }
}
