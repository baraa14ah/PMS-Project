<?php

namespace App\Services;

use App\Models\User;
use App\Models\Project;
use Illuminate\Support\Facades\DB;

class StudentService
{
    /**
     * جلب أعضاء المشروع (المالك + الأعضاء المقبولين)
     */
    public function getProjectMembers($projectId)
    {
        $project = Project::with(['user:id,name,email'])->find($projectId);
        if (!$project) return null;

        // جلب الأعضاء الذين قبلوا الدعوة فقط
        $members = User::whereHas('projectsAsMember', function ($query) use ($projectId) {
            $query->where('project_id', $projectId)
                  ->where('project_members.status', 'accepted');
        })->select('id', 'name', 'email')->get();

        return [
            'owner' => $project->user,
            'members' => $members
        ];
    }

    /**
     * جلب قائمة الطلاب المتاحين للدعوة (غير الموجودين في المشروع حالياً)
     */
    public function getAvailableStudents($projectId, $search = null)
    {
        $query = User::where('role_id', 2) // دور الطالب
            ->whereDoesntHave('projectsAsMember', function ($q) use ($projectId) {
                $q->where('project_id', $projectId);
            })
            ->where('id', '!=', Project::find($projectId)->user_id); // استبعاد المالك

        if ($search) {
            $query->where('name', 'like', "%{$search}%");
        }

        return $query->select('id', 'name', 'email')->get();
    }
}