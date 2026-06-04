<?php

namespace App\Services;

use App\Models\User;
use App\Models\Project;
use Illuminate\Support\Facades\DB;

class StudentService
{
    public function getProjectMembers($projectId)
    {
        $project = Project::query()->with(['user:id,name,email'])->whereKey($projectId)->first();
        if (!$project) {
            return null;
        }

        $memberIds = DB::table('project_members')
            ->where('project_id', $projectId)
            ->where('status', 'accepted')
            ->pluck('student_id');

        $members = User::query()
            ->whereIn('id', $memberIds)
            ->select('id', 'name', 'email', 'university_id')
            ->get();

        return [
            'owner' => $project->user,
            'members' => $members,
        ];
    }

    /**
     * طلاب نفس جامعة المشروع — غير المالك وغير الأعضاء الحاليين في project_members.
     */
    public function getAvailableStudents($projectId, $search = null)
    {
        $project = Project::query()->whereKey($projectId)->first();
        if (!$project || !$project->university_id) {
            return collect();
        }

        $memberIds = DB::table('project_members')
            ->where('project_id', $projectId)
            ->pluck('student_id')
            ->all();

        $excludeIds = array_unique(array_filter(array_merge($memberIds, [$project->user_id])));

        $query = User::query()
            ->where('status', 'active')
            ->whereHas('role', fn ($q) => $q->where('name', 'student'))
            ->inUniversity((int) $project->university_id)
            ->when(!empty($excludeIds), fn ($q) => $q->whereNotIn('id', $excludeIds));

        if ($search) {
            $term = '%' . trim($search) . '%';
            $query->where(function ($q) use ($term) {
                $q->where('name', 'like', $term)
                    ->orWhere('email', 'like', $term)
                    ->orWhere('student_number', 'like', $term);
            });
        }

        return $query
            ->select('id', 'name', 'email', 'student_number', 'university_id')
            ->orderBy('name')
            ->get();
    }
}
