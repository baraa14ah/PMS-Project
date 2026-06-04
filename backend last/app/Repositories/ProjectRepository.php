<?php

namespace App\Repositories;

use App\Models\Project;
use App\Models\User;

class ProjectRepository
{
    public function create(array $data): Project
    {
        return Project::create($data);
    }

    public function findById(int $id): ?Project
    {
        // نجيب المشروع مع صاحب المشروع
        return Project::query()->with('user')->whereKey($id)->first();
    }

    public function getForUser(User $user)
    {
        // Supervisor (manager) يشوف المشاريع اللي هو مشرف عليها
        if ($user->role?->name === 'manager' || $user->role?->name === 'supervisor') {
            return Project::where('supervisor_id', $user->id)
                ->with('user')
                ->get();
        }

        // Student يشوف المشاريع تبعه
        if ($user->role?->name === 'student') {
            return Project::where('user_id', $user->id)
                ->with('user')
                ->get();
        }

        // Admin (أو أي دور آخر) يعتمد على TenantScope فقط
        return Project::with('user')->get();
    }

    public function update(Project $project, array $data): Project
    {
        $project->update($data);
        return $project;
    }

    public function delete(Project $project): void
    {
        $project->delete();
    }
}
