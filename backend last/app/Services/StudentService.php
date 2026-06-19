<?php

namespace App\Services;

use App\Models\User;
use App\Models\Project;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class StudentService
{
    /** Returns students eligible for invitation, excluding owner and current members. */
    public function getAvailableStudents(int $projectId, ?string $search = null): Collection
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
