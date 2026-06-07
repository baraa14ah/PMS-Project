<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckUserStatus
{
    /** Reject requests from inactive, pending, or rejected users. */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user || $user->isActive()) {
            return $next($request);
        }

        if ($user->isPending()) {
            return response()->json([
                'message' => 'Account pending approval.',
                'status' => 'pending',
            ], 403);
        }

        if ($user->isRejected()) {
            return response()->json([
                'message' => 'Account has been rejected. Contact your university administrator or register again.',
                'status' => 'rejected',
            ], 403);
        }

        return response()->json([
            'message' => 'Account is not active. Contact your university administrator.',
            'status' => $user->status ?? 'unknown',
        ], 403);
    }
}
