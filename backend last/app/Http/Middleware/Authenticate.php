<?php

namespace App\Http\Middleware;

use Illuminate\Auth\Middleware\Authenticate as Middleware;
use Illuminate\Http\Request;

class Authenticate extends Middleware
{
    /**
     * Get the path the user should be redirected to when they are not authenticated.
     */
    protected function redirectTo($request)
    {
        // في API ما نعمل redirect لصفحة login
        // نرجع 401 JSON دائمًا
        if (! $request->expectsJson()) {
            return null;
        }
    }
    
}
