<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable, SoftDeletes;

    protected $fillable = [
        'name',
        'email',
        'password',
        'id_departamento',
        'role',
        'cargo',
        'area',
        'pais',
        'ciudad',
        'oficina',
        'id_empresa',
        'id_area',
        'id_jefe',
    ];

    public function departamento(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Departamento::class, 'id_departamento');
    }

    public function empresa(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Empresa::class, 'id_empresa');
    }

    public function areaRel(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Area::class, 'id_area');
    }

    public function jefe(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class, 'id_jefe');
    }

    public function views(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(UserView::class);
    }

    /**
     * Get ALL subordinate user IDs recursively down the hierarchy chain.
     */
    public function getAllSubordinateIds(): \Illuminate\Support\Collection
    {
        $allIds = collect();
        $directIds = User::where('id_jefe', $this->id)->pluck('id');

        while ($directIds->isNotEmpty()) {
            $allIds = $allIds->merge($directIds);
            $directIds = User::whereIn('id_jefe', $directIds)->pluck('id');
        }

        return $allIds;
    }

    /**
     * Check if this user is a jefe (has at least one subordinate).
     */
    public function isJefe(): bool
    {
        return User::where('id_jefe', $this->id)->exists();
    }

    /**
     * Check if user has access to a specific view.
     * Admins have access to everything automatically.
     * Jefes (anyone with subordinates) get default access to 'courses'.
     */
    public function hasViewAccess(string $viewKey): bool
    {
        if ($this->role === 'admin') {
            return true;
        }

        // Default views for all authenticated users
        $defaultViews = ['dashboard'];

        if (in_array($viewKey, $defaultViews)) {
            return true;
        }

        // Jefes get default access to courses catalog
        if ($viewKey === 'courses' && $this->isJefe()) {
            return true;
        }

        return $this->views()->where('view_key', $viewKey)->exists();
    }

    public function cursos(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(Curso::class, 'cursos_users', 'id_user', 'id_curso')
            ->withPivot('id', 'curso_estado', 'id_user_mod')
            ->withTimestamps();
    }

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }
}
