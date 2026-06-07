<?php

namespace App\Repositories;

use App\Models\Project;
use App\Models\User;

class ProjectRepository
{
    /** Create and persist a new project. */
    public function create(array $data): Project
    {
        return Project::create($data);
    }

    /** Find a project by ID with its owner loaded. */
    public function findById(int $id): ?Project
    {
        return Project::query()->with('user')->whereKey($id)->first();
    }

    /** List projects visible to the given user based on role. */
    public function getForUser(User $user)
    {
        if ($user->role?->name === 'manager' || $user->role?->name === 'supervisor') {
            return Project::where('supervisor_id', $user->id)
                ->with('user')
                ->get();
        }

        if ($user->role?->name === 'student') {
            return Project::where('user_id', $user->id)
                ->with('user')
                ->get();
        }

        return Project::with('user')->get();
    }

    /** Update the given project with the provided data. */
    public function update(Project $project, array $data): Project
    {
        $project->update($data);
        return $project;
    }

    /** Delete the given project. */
    public function delete(Project $project): void
    {
        $project->delete();
    }
}
