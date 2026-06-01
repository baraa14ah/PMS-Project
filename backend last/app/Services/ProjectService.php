<?php

namespace App\Services;

use App\Models\Project;
use App\Repositories\ProjectRepository;
use Illuminate\Http\Request;

class ProjectService
{
    protected ProjectRepository $projects;

    public function __construct(ProjectRepository $projects)
    {
        $this->projects = $projects;
    }

    public function create(Request $request): Project
    {
        $data = $request->validate([
            'title'            => 'required|string|max:255',
            'description'      => 'nullable|string',
            'github_repo_url'  => 'nullable|url',
            'supervisor_id'    => 'nullable|exists:users,id',
        ]);

        $data['user_id'] = $request->user()->id;
        $data['status']  = 'pending';

        return $this->projects->create($data);
    }

    public function listForUser($user)
    {
        return $this->projects->getForUser($user);
    }

    public function update(Request $request, int $id, $user)
    {
        $project = $this->projects->findById($id);

        if (!$project) {
            return null;
        }

        $data = $request->validate([
            'title'            => 'sometimes|string|max:255',
            'description'      => 'nullable|string',
            'status'           => 'nullable|in:pending,in_progress,completed',
            'github_repo_url'  => 'nullable|url',
            'supervisor_id'    => 'nullable|exists:users,id',
        ]);

        $isAdmin = $user->role?->name === 'admin';

        if (!$isAdmin && $project->user_id !== $user->id) {
            return 'unauthorized';
        }

        $data['status'] = $data['status'] ?? $project->status;

        return $this->projects->update($project, $data);
    }

    public function delete(int $id, $user)
    {
        $project = $this->projects->findById($id);

        if (!$project) {
            return null;
        }

        $isAdmin = $user->role?->name === 'admin';

        if (!$isAdmin && $project->user_id !== $user->id) {
            return 'unauthorized';
        }

        $this->projects->delete($project);

        return true;
    }

    public function progress(int $id): ?array
    {
        $project = Project::with('tasks')->find($id);

        if (!$project) {
            return null;
        }

        $totalTasks      = $project->tasks->count();
        $pendingTasks    = $project->tasks->where('status', 'pending')->count();
        $inProgressTasks = $project->tasks->where('status', 'in_progress')->count();
        $completedTasks  = $project->tasks->where('status', 'completed')->count();

        $progress = $totalTasks > 0
            ? round(($completedTasks / $totalTasks) * 100, 2)
            : 0;

        // 💡 التعديل السحري: تحديث حالة المشروع في الداتا بيز تلقائياً!
        $newStatus = 'pending';
        if ($totalTasks > 0 && $completedTasks === $totalTasks) {
            $newStatus = 'completed';
        } elseif ($completedTasks > 0 || $inProgressTasks > 0) {
            $newStatus = 'in_progress';
        }

        // إذا تغيرت الحالة، احفظها في قاعدة البيانات فوراً (تتخطى مشاكل الصلاحيات)
        if ($project->status !== $newStatus) {
            $project->status = $newStatus;
            $project->save();
        }

        return [
            'project_id'          => $project->id,
            'total_tasks'         => $totalTasks,
            'pending_tasks'       => $pendingTasks,
            'in_progress_tasks'   => $inProgressTasks,
            'completed_tasks'     => $completedTasks,
            'progress_percentage' => $progress,
        ];
    }
    public function getProjectFullDetails(int $id)
    {
        return Project::with([
            'user:id,name,email',
            'supervisor:id,name,email',
            'tasks',
            'comments.user:id,name',
            'versions.user:id,name',
            'members'
        ])->find($id);
    }

    // ✅ الدالة المفقودة 2: حساب التقدم (لأن الكنترولر يطلبها بهذا الاسم)
    public function calculateProgress(int $id): ?array
    {
        return $this->progress($id);
    }
    // ✅ دالة جلب الطلاب المتاحين للدعوة (المنطق البرمجي)
    /**
     * جلب الطلاب المتاحين للدعوة فقط
     * (يستبعد المالك، ويستبعد الأعضاء الحاليين في المشروع)
     */
    public function getAvailableStudentsForInvite(int $projectId)
    {
        // 1. جلب أرقام الطلاب المسجلين فعلياً في هذا المشروع من جدول الوسيط
        $existingMemberIds = \Illuminate\Support\Facades\DB::table('project_members')
            ->where('project_id', $projectId)
            ->pluck('student_id')
            ->toArray();

        // 2. جلب رقم صاحب المشروع (المالك) لضمان استبعاده أيضاً
        $project = \App\Models\Project::find($projectId);
        $ownerId = $project ? $project->user_id : null;

        // 3. دمج القائمتين في مصفوفة واحدة للاستبعاد
        $excludeIds = array_unique(array_merge($existingMemberIds, [$ownerId]));
        // تنظيف المصفوفة من أي قيم null
        $excludeIds = array_filter($excludeIds);

        // 4. جلب الطلاب الذين ليسوا ضمن قائمة الاستبعاد
        return \App\Models\User::whereNotIn('id', $excludeIds)
            ->get()
            ->filter(function ($user) {
                // التأكد من أن الدور هو "طالب"
                $roleName = is_string($user->role) ? strtolower($user->role) : strtolower($user->role?->name ?? '');
                return $roleName === 'student';
            })
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                ];
            })
            ->values();
    }
}