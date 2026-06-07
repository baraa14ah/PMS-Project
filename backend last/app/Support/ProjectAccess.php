<?php

namespace App\Support;

use App\Models\Project;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class ProjectAccess
{
    /** Determine whether the user may access the given project. */
    public static function canAccess(?User $user, ?Project $project): bool
    {
        if (!$user || !$project) {
            return false;
        }

        $roleName = strtolower($user->role?->name ?? '');

        if ($roleName === 'super_admin') {
            return true;
        }

        if ($roleName === 'admin') {
            return $user->university_id
                && (int) $project->university_id === (int) $user->university_id;
        }

        if ((int) $project->user_id === (int) $user->id) {
            return true;
        }

        if ((int) $project->supervisor_id === (int) $user->id) {
            return true;
        }

        if (!$user->university_id) {
            return false;
        }

        return DB::table('project_members')
            ->join('projects', 'project_members.project_id', '=', 'projects.id')
            ->where('projects.id', $project->id)
            ->where('projects.university_id', $user->university_id)
            ->where('project_members.student_id', $user->id)
            ->where('project_members.status', 'accepted')
            ->exists();
    }
}
