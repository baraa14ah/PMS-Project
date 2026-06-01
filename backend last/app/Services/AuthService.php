<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthService
{
    public function register($request)
    {
        $user = User::create([
            'name'      => $request->name,
            'email'     => $request->email,
            'password'  => Hash::make($request->password),
            'role_id'   => $request->role_id,
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return [
            'message' => 'User registered successfully',
            'user'    => $user,
            'token'   => $token,
        ];
    }

    public function login($request)
    {
        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Incorrect email or password.'],
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return [
            'message' => 'Login successful',
            'token'   => $token,
        ];
    }

    public function logout($request)
    {
        $request->user()->currentAccessToken()->delete();

        return ['message' => 'Logged out successfully'];
    }
}
