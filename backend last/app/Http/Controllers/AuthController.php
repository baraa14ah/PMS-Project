<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\AuthService;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Role;

class AuthController extends Controller
{
    protected $authService;

    public function __construct(AuthService $authService)
    {
        $this->authService = $authService;
    }

    public function register(Request $request)
    {
        $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users,email',
            'password' => 'required|min:6',
            // ✅ نستقبل role كنص بدل role_id
            'role'     => 'required|in:student,supervisor',
        ]);
    
        // ✅ نحول role إلى role_id من جدول roles
        $role = Role::where('name', $request->role)->first();
    
        if (!$role) {
            return response()->json(['message' => 'Role not found'], 422);
        }
    
        // ✅ حماية إضافية: ممنوع إنشاء admin حتى لو أحد حاول يمرره
        if ($role->name === 'admin') {
            return response()->json(['message' => 'Unauthorized role'], 403);
        }
    
        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => bcrypt($request->password),
            'role_id'  => $role->id,
        ]);
    
        $user->load('role');
    
        $token = $user->createToken('auth_token')->plainTextToken;
    
        return response()->json([
            'message' => 'Registered successfully',
            'token'   => $token,
            'user'    => $user,
            'role'    => $user->role?->name,
        ], 201);
    }
    
    public function login(Request $request)
    {
        // AuthService يجب أن يرجع token + user
        $result = $this->authService->login($request);

        // لو الـ service يرجع user كـ array أو model
        $user = null;

        if (is_array($result) && isset($result['user'])) {
            $user = $result['user'];
        }

        // إذا user هو Model
        if ($user instanceof User) {
            $user->load('role');
            $result['user'] = $user;
            $result['role'] = $user->role?->name;
        }
        // إذا user جاي كـ array (مش Model) نحاول نجيبه من DB
        elseif (is_array($user) && isset($user['id'])) {
            $u = User::with('role')->find($user['id']);
            if ($u) {
                $result['user'] = $u;
                $result['role'] = $u->role?->name;
            }
        }

        return response()->json($result);
    }

    public function logout(Request $request)
    {
        return response()->json($this->authService->logout($request));
    }

    public function profile(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $user->load('role');

        return response()->json([
            'user' => $user,
            'role' => $user->role?->name,
        ]);
    }

    public function updateProfile(Request $request)
    {
        $request->validate([
            'name'  => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $request->user()->id,
        ]);

        $user = $request->user();
        $user->name = $request->name;
        $user->email = $request->email;
        $user->save();

        $user->load('role');

        return response()->json([
            'message' => 'Profile updated successfully',
            'user'    => $user,
            'role'    => $user->role?->name,
        ]);
    }

    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required',
            'new_password'     => 'required|min:6|confirmed',
        ]);

        $user = $request->user();

        // ✅ الشرط كان مقلوب عندك
        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json(['message' => 'Current password is incorrect'], 422);
        }

        $user->password = Hash::make($request->new_password);
        $user->save();

        return response()->json([
            'message' => 'Password updated successfully'
        ]);
    }
}
