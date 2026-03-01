<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class AdminMiddleware
{
    /**
     * Strictly enforce that the authenticated user has role === 'admin'.
     *
     * Returns 401 when no user is authenticated at all, and 403 when
     * a user is present but is NOT an admin (security hardened).
     */
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        // Strict role check — deliberately avoids the isAdmin() helper so
        // any future proxy/override of that method cannot bypass this gate.
        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Forbidden. Admin access required.'], 403);
        }

        return $next($request);
    }
}
