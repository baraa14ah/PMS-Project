<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        // المستخدم غير مسجّل
        if (!$request->user()) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        // لا يوجد دور مرتبط بالمستخدم
        if (!$request->user()->role) {
            return response()->json(['message' => 'User role not found'], 403);
        }

        // اسم دور المستخدم (تنظيف + توحيد)
        $userRole = strtolower(trim($request->user()->role->name));

        // الأدوار المسموحة
        $allowedRoles = array_map(
            fn ($r) => strtolower(trim($r)),
            $roles
        );

        // تحقق
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
