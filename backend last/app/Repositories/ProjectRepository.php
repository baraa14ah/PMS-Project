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
        return Project::with('user')->find($id);
    }

    public function getForUser(User $user)
    {
        // Admin يشوف كل المشاريع
        if ($user->role?->name === 'admin') {
            return Project::with('user')->get();
        }

        // Supervisor (manager) يشوف المشاريع اللي هو مشرف عليها
        if ($user->role?->name === 'manager') {
            return Project::where('supervisor_id', $user->id)
                ->with('user')
                ->get();
        }

        // Student يشوف المشاريع تبعه
        return Project::where('user_id', $user->id)
            ->with('user')
            ->get();
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
