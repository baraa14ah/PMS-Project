<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function supervisors(Request $request)
    {
        // لازم يكون المستخدم مسجل دخول
        if (!$request->user()) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        // جلب المشرفين حسب role name
        $supervisors = User::whereHas('role', function ($q) {
                $q->where('name', 'supervisor');
            })
            ->select('id', 'name', 'email')
            ->orderBy('name')
            ->get();

        return response()->json(['supervisors' => $supervisors]);
    }
}
