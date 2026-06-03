<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    // 🎯 1. الدالة الجديدة: جلب كل المستخدمين (لعرضهم في لوحة تحكم المدير)
    public function index(Request $request)
    {
        // نجلب المستخدمين مع صلاحياتهم (role) لنعرضها في الرياكت
        $users = User::with('role')->orderBy('created_at', 'desc')->get();

        return response()->json([
            'users' => $users
        ], 200);
    }
// 🎯 دالة تعديل بيانات المستخدم
public function update(Request $request, $id)
{
    $user = User::find($id);
    if (!$user) {
        return response()->json(['message' => 'المستخدم غير موجود'], 404);
    }

    $request->validate([
        'name' => 'required|string|max:255',
        'email' => 'required|email|unique:users,email,' . $id,
    ]);

    $user->name = $request->name;
    $user->email = $request->email;
    $user->save();

    return response()->json(['message' => 'تم تحديث البيانات بنجاح']);
}

// 🎯 دالة حذف المستخدم
public function destroy($id)
{
    $user = User::find($id);
    if (!$user) {
        return response()->json(['message' => 'المستخدم غير موجود'], 404);
    }

    $user->delete();
    return response()->json(['message' => 'تم حذف المستخدم بنجاح']);
}
 
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