<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasUniversity
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user() && is_null($request->user()->university_id)) {
            return response()->json([
                'message' => 'Account is not assigned to a university. Contact your administrator.',
                'code'    => 'no_university',
            ], 403);
        }

        return $next($request);
    }
}
