<?php

namespace App\Services;

use App\Models\Role;
use App\Models\University;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AuthService
{
    /**
     * Self-service registration (student/supervisor). Matches AuthController FR-002, FR-015, FR-017.
     */
    public function register(Request $request): array
    {
        $existingUser = User::where('email', $request->email)->first();

        if ($existingUser) {
            if ($existingUser->status === 'rejected') {
                $universityId = $this->resolveUniversityId($request);
                if ($universityId === false) {
                    return ['error' => ['message' => 'Selected university is not active.', 'status' => 422]];
                }

                $request->validate($this->registrationRules($request, $universityId, $existingUser->id));

                $role = Role::where('name', $request->role)->first();
                if (!$role) {
                    return ['error' => ['message' => 'Role not found', 'status' => 422]];
                }

                $existingUser->update([
                    'name'            => $request->name,
                    'password'        => $request->password,
                    'role_id'         => $role->id,
                    'status'          => 'pending',
                    'university_id'   => $universityId ?? $existingUser->university_id,
                    'student_number'  => $request->role === 'student' ? $request->student_number : null,
                ]);

                $this->syncStudentProfile($existingUser);

                $existingUser->load('role');
                $token = $existingUser->createToken('auth_token')->plainTextToken;

                return [
                    'message' => 'Registered successfully (re-registration)',
                    'token'   => $token,
                    'user'    => $existingUser,
                    'role'    => $existingUser->role?->name,
                    'status'  => 201,
                ];
            }

            if ($existingUser->status === 'pending') {
                return ['error' => ['message' => 'Account already awaiting approval.', 'status' => 422]];
            }
        }

        $universityId = $this->resolveUniversityId($request);
        if ($universityId === false) {
            return ['error' => ['message' => 'Selected university is not active.', 'status' => 422]];
        }

        $request->validate($this->registrationRules($request, $universityId));

        $role = Role::where('name', $request->role)->first();

        if (!$role) {
            return ['error' => ['message' => 'Role not found', 'status' => 422]];
        }

        if ($role->name === 'admin') {
            return ['error' => ['message' => 'Unauthorized role', 'status' => 403]];
        }

        $user = User::create([
            'name'           => $request->name,
            'email'          => $request->email,
            'password'       => $request->password,
            'role_id'        => $role->id,
            'university_id'  => $universityId,
            'student_number' => $request->role === 'student' ? $request->student_number : null,
            'status'         => 'pending',
        ]);

        $this->syncStudentProfile($user);
        $user->load('role');
        $token = $user->createToken('auth_token')->plainTextToken;

        return [
            'message' => 'Registered successfully',
            'token'   => $token,
            'user'    => $user,
            'role'    => $user->role?->name,
            'status'  => 201,
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
            'user'    => $user,
        ];
    }

    public function logout($request)
    {
        $request->user()->currentAccessToken()->delete();

        return ['message' => 'Logged out successfully'];
    }

    /** @return int|false University id, or false when submitted id is inactive */
    private function resolveUniversityId(Request $request): int|false
    {
        if ($request->filled('university_id')) {
            $uni = University::where('id', $request->university_id)->where('is_active', true)->first();
            if (!$uni) {
                return false;
            }
            return (int) $uni->id;
        }

        return University::defaultId();
    }

    private function registrationRules(Request $request, int $universityId, ?int $userId = null): array
    {
        $rules = [
            'name'          => 'required|string|max:255',
            'email'         => $userId ? 'required|email' : 'required|email|unique:users,email',
            'password'      => 'required|min:6',
            'role'          => 'required|in:student,supervisor',
            'university_id' => 'nullable|integer|exists:universities,id',
        ];

        if ($request->role === 'student') {
            $rules['student_number'] = [
                'required',
                'string',
                'max:50',
                Rule::unique('users', 'student_number')
                    ->where(fn ($q) => $q->where('university_id', $universityId))
                    ->ignore($userId),
            ];
        }

        return $rules;
    }

    private function syncStudentProfile(User $user): void
    {
        $user->loadMissing('role');
        if ($user->role?->name !== 'student' || !$user->student_number) {
            return;
        }

        $user->profile()->updateOrCreate(
            ['user_id' => $user->id],
            ['student_number' => $user->student_number],
        );
    }
}
