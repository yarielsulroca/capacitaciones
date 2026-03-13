<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckViewAccess
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $viewKey): Response
    {
        $user = $request->user();

        if (!$user || !$user->hasViewAccess($viewKey)) {
            abort(403, 'No tienes acceso a esta vista.');
        }

        return $next($request);
    }
}
