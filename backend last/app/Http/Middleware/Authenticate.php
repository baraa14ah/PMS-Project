<?php

namespace App\Http\Middleware;

use Illuminate\Auth\Middleware\Authenticate as Middleware;
use Illuminate\Http\Request;

class Authenticate extends Middleware
{
    /** Return login redirect path or null for JSON API requests. */
    protected function redirectTo($request)
    {
        if (! $request->expectsJson()) {
            return null;
        }
    }
}
