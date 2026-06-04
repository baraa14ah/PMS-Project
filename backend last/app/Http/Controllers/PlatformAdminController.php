<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Role;
use App\Models\University;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PlatformAdminController extends Controller
{
    public function dashboardStats()
    {
        return response()->json([
            'stats' => [
                'universities' => University::query()->count(),
                'users'        => User::query()
                    ->whereHas('role', fn ($q) => $q->where('name', '!=', 'super_admin'))
                    ->count(),
                'projects'     => Project::query()->count(),
                'pending_users' => User::query()
                    ->where('status', 'pending')
                    ->whereHas('role', fn ($q) => $q->whereNotIn('name', ['super_admin', 'admin']))
                    ->count(),
            ],
        ]);
    }

    public function indexUsers(Request $request)
    {
        $query = User::query()
            ->with(['role', 'university', 'supervisorUniversities:id,name'])
            ->whereHas('role', fn ($q) => $q->where('name', '!=', 'super_admin'))
            ->where('id', '!=', $request->user()->id)
            ->applyUserListFilters($request)
            ->orderByDesc('created_at');

        if ($request->filled('university_id')) {
            $uniId = (int) $request->university_id;
            $query->where(function ($q) use ($uniId) {
                $q->where('university_id', $uniId)
                    ->orWhereHas('supervisorUniversities', fn ($sq) => $sq->where('universities.id', $uniId));
            });
        }

        return response()->json(['users' => $query->get()]);
    }

    public function storeUser(Request $request)
    {
        $request->validate([
            'name'            => 'required|string|max:255',
            'email'           => 'required|email|unique:users,email',
            'password'        => 'required|min:6',
            'role'            => 'required|string|in:admin,supervisor,student',
            'university_id'   => 'required|integer|exists:universities,id',
            'university_ids'  => 'nullable|array',
            'university_ids.*' => 'integer|exists:universities,id',
            'status'          => 'nullable|string|in:pending,active,rejected',
        ]);

        $role = Role::where('name', $request->role)->first();
        if (!$role) {
            return response()->json(['message' => 'Role not found'], 422);
        }

        $primaryUniversityId = (int) $request->university_id;
        $university = University::whereKey($primaryUniversityId)->where('is_active', true)->first();
        if (!$university) {
            return response()->json(['message' => 'University is not active.'], 422);
        }

        if ($request->role === 'student') {
            $request->validate([
                'student_number' => [
                    'required',
                    'string',
                    'max:50',
                    \Illuminate\Validation\Rule::unique('users', 'student_number')
                        ->where(fn ($q) => $q->where('university_id', $primaryUniversityId)),
                ],
            ]);
        }

        $user = User::create([
            'name'          => $request->name,
            'email'         => $request->email,
            'password'      => $request->password,
            'role_id'       => $role->id,
            'university_id'  => $primaryUniversityId,
            'student_number' => $request->role === 'student' ? $request->student_number : null,
            'status'         => $request->input('status', 'active'),
        ]);

        $this->syncSupervisorUniversitiesFromRequest($user, $request);
        $this->syncStudentProfile($user);
        $user->load(['role', 'university', 'supervisorUniversities:id,name']);

        return response()->json([
            'message' => 'User created successfully.',
            'user'    => $user,
        ], 201);
    }

    public function updateUser(Request $request, $id)
    {
        $user = User::query()->whereKey($id)->first();
        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        if ($user->isSuperAdmin()) {
            return response()->json(['message' => 'Cannot modify platform super admin accounts.'], 403);
        }

        $request->validate([
            'name'            => 'sometimes|string|max:255',
            'email'           => 'sometimes|email|unique:users,email,' . $id,
            'password'        => 'sometimes|min:6',
            'role'            => 'sometimes|string|in:admin,supervisor,student',
            'university_id'   => 'sometimes|integer|exists:universities,id',
            'university_ids'  => 'nullable|array',
            'university_ids.*' => 'integer|exists:universities,id',
            'status'          => 'sometimes|string|in:pending,active,rejected',
            'student_number'  => 'nullable|string|max:50',
        ]);

        if ($request->has('name')) {
            $user->name = $request->name;
        }
        if ($request->has('email')) {
            $user->email = $request->email;
        }
        if ($request->has('password')) {
            $user->password = $request->password;
        }
        if ($request->has('status')) {
            $user->status = $request->status;
        }
        if ($request->has('university_id')) {
            $user->university_id = $request->university_id;
        }
        if ($request->has('role')) {
            $role = Role::where('name', $request->role)->first();
            if (!$role) {
                return response()->json(['message' => 'Role not found'], 422);
            }
            $user->role_id = $role->id;
        }
        if ($request->has('student_number')) {
            $user->student_number = $request->student_number;
        }

        $user->load('role');
        if ($user->role?->name === 'student') {
            $request->validate([
                'student_number' => [
                    'required',
                    'string',
                    'max:50',
                    \Illuminate\Validation\Rule::unique('users', 'student_number')
                        ->where(fn ($q) => $q->where('university_id', $user->university_id))
                        ->ignore($user->id),
                ],
            ]);
        } else {
            $user->student_number = null;
        }

        $user->save();
        $this->syncSupervisorUniversitiesFromRequest($user, $request);
        $this->syncStudentProfile($user);
        $user->load(['role', 'university', 'supervisorUniversities:id,name']);

        return response()->json([
            'message' => 'User updated successfully.',
            'user'    => $user,
        ]);
    }

    public function destroyUser($id)
    {
        $user = User::query()->whereKey($id)->first();
        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        if ($user->isSuperAdmin()) {
            return response()->json(['message' => 'Cannot delete platform super admin accounts.'], 403);
        }

        return app(UserController::class)->destroy($id);
    }

    public function indexProjects(Request $request)
    {
        $query = Project::query()
            ->with(['user:id,name,email', 'supervisor:id,name,email', 'university:id,name'])
            ->orderByDesc('created_at');

        if ($request->filled('search')) {
            $term = '%' . trim($request->search) . '%';
            $query->where(function ($q) use ($term) {
                $q->where('title', 'like', $term)
                    ->orWhere('description', 'like', $term);
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('university_id')) {
            $query->where('university_id', (int) $request->university_id);
        }

        return response()->json(['projects' => $query->get()]);
    }

    public function updateProject(Request $request, $id)
    {
        $project = Project::query()->whereKey($id)->first();
        if (!$project) {
            return response()->json(['message' => 'Project not found'], 404);
        }

        $request->validate([
            'title'       => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'status'      => 'nullable|in:pending,in_progress,completed',
        ]);

        $project->update($request->only(['title', 'description', 'status']));
        $project->load(['user:id,name', 'supervisor:id,name', 'university:id,name']);

        return response()->json([
            'message' => 'Project updated successfully.',
            'project' => $project,
        ]);
    }

    public function destroyProject($id)
    {
        $project = Project::query()->whereKey($id)->first();
        if (!$project) {
            return response()->json(['message' => 'Project not found'], 404);
        }

        DB::transaction(function () use ($project) {
            $pid = $project->id;
            DB::table('comments')->where('project_id', $pid)->delete();
            DB::table('project_versions')->where('project_id', $pid)->delete();
            DB::table('project_activities')->where('project_id', $pid)->delete();
            DB::table('ratings')->where('project_id', $pid)->delete();
            DB::table('student_invitations')->where('project_id', $pid)->delete();
            DB::table('supervisor_invitations')->where('project_id', $pid)->delete();
            DB::table('project_members')->where('project_id', $pid)->delete();
            $project->tasks()->delete();
            $project->delete();
        });

        return response()->json(['message' => 'Project deleted successfully.']);
    }

    private function syncSupervisorUniversitiesFromRequest(User $user, Request $request): void
    {
        if (!$user->isSupervisorRole()) {
            return;
        }

        $ids = $request->input('university_ids', []);
        if (!is_array($ids)) {
            $ids = [];
        }
        if (empty($ids) && $request->filled('university_id')) {
            $ids = [(int) $request->university_id];
        }

        $user->syncSupervisorUniversities($ids);
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
