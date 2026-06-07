<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /** Restrict route access to users with allowed roles. */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        if (!$request->user()) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        if (!$request->user()->role) {
            return response()->json(['message' => 'User role not found'], 403);
        }

        $userRole = strtolower(trim($request->user()->role->name));

        $allowedRoles = array_map(
            fn ($r) => strtolower(trim($r)),
            $roles
        );

        if (!in_array($userRole, $allowedRoles)) {
            return response()->json([
                'message' => 'Unauthorized - Role not allowed',
                'role' => $userRole,
                'allowed' => $allowedRoles,
            ], 403);
        }

        return $next($request);
    }
}
