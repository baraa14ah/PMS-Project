<?php

namespace App\Services;
use App\Models\ProjectActivity;
use App\Models\Task;
use App\Models\Project;
use Illuminate\Support\Facades\DB;
use App\Services\NotificationService;

class TaskService
{
    protected NotificationService $notifications;

    public function __construct(NotificationService $notifications)
    {
        $this->notifications = $notifications;
    }

    private function getRoleName($user): string
    {
        return $user->role?->name ?? (string)($user->role ?? '');
    }

    private function canAccessProject($user, $project): bool
    {
        if (!$user || !$project) return false;

        if ((int)$project->user_id === (int)$user->id) return true;
        if ((int)$project->supervisor_id === (int)$user->id) return true;

        return DB::table('project_members')
            ->join('projects', 'project_members.project_id', '=', 'projects.id')
            ->where('projects.id', $project->id)
            ->where('projects.university_id', $user->university_id)
            ->where('project_members.student_id', $user->id)
            ->where('project_members.status', 'accepted')
            ->exists();
    }

    /**
     * ✅ دالة حساب نسبة التقدم
     */
    public function calculateProjectProgress($projectId)
    {
        $total = Task::query()->where('project_id', $projectId)->count();
        if ($total === 0) return 0;

        $completed = Task::query()->where('project_id', $projectId)->where('status', 'completed')->count();
        return (int) round(($completed / $total) * 100);
    }

    public function getProjectTasks($projectId, $user)
    {
        $project = Project::query()->whereKey($projectId)->first();
        if (!$project) return ['status' => 404, 'message' => 'Project not found'];

        if (!$this->canAccessProject($user, $project)) {
            return ['status' => 403, 'message' => 'Unauthorized'];
        }

        // ✅ استخدمنا assignedTo بدلاً من user
        $tasks = Task::query()->where('project_id', $projectId)
            ->with('assignedTo') 
            ->orderBy('created_at', 'desc')
            ->get();

        return ['status' => 200, 'tasks' => $tasks];
    }

    public function createTask($data, $user)
    {
        $project = Project::query()->whereKey($data['project_id'])->first();
        if (!$project) return ['status' => 404, 'message' => 'Project not found'];
        if (!$this->canAccessProject($user, $project)) return ['status' => 403, 'message' => 'Unauthorized'];

        $task = Task::create([
            'project_id'  => $project->id,
            'university_id' => $project->university_id,
            'title'       => $data['title'],
            'description' => $data['description'] ?? null,
            'deadline'    => $data['deadline'] ?? null,
            'status'      => 'pending',
            'created_by'  => $user->id,
            'assigned_to' => $user->id,
        ]);

        // 🎯 1. تسجيل النشاط في السجل الزمني
        ProjectActivity::create([
            'project_id' => $project->id,
            'user_id' => $user->id,
            'action' => "أضاف مهمة جديدة: {$task->title}",
            'type' => 'create'
        ]);

        $this->notifications->notifyProjectParticipants(
            projectId: (int)$project->id,
            actorUserId: (int)$user->id,
            type: 'task.created',
            title: 'مهمة جديدة',
            body: "{$user->name} أضاف مهمة جديدة: {$task->title}",
            data: ['project_id' => $project->id, 'task_id' => $task->id, 'url' => "/dashboard/projects/{$project->id}"]
        );
        $task->load('assignedTo');

        return [
            'status' => 201, 
            'task' => $task, 
            'new_progress' => $this->calculateProjectProgress($project->id)
        ];
    }

    public function updateTask($taskId, $data, $user)
    {
        $task = Task::query()->whereKey($taskId)->first();
        if (!$task) return ['status' => 404, 'message' => 'Task not found'];

        $project = Project::query()->whereKey($task->project_id)->first();
        if (!$this->canAccessProject($user, $project)) return ['status' => 403, 'message' => 'Unauthorized'];

        $oldStatus = $task->status;
        $task->update($data);

        // إذا تم تغيير حالة المهمة فعلياً
        if (isset($data['status']) && $oldStatus !== $task->status) {
            
            // 🎯 2. إعداد وتلوين السجل الزمني بناءً على الحالة
            $activityType = 'update';
            $statusName = 'قيد الانتظار';

            if ($task->status === 'completed') {
                $activityType = 'complete';
                $statusName = 'مكتملة';
            } elseif ($task->status === 'in_progress') {
                $activityType = 'progress';
                $statusName = 'قيد التنفيذ';
            }

            ProjectActivity::create([
                'project_id' => $project->id,
                'user_id' => $user->id,
                'action' => "غيّر حالة المهمة '{$task->title}' إلى {$statusName}",
                'type' => $activityType
            ]);

            $this->notifications->notifyProjectParticipants(
                projectId: (int)$project->id,
                actorUserId: (int)$user->id,
                type: 'task.status_changed',
                title: 'تحديث حالة مهمة',
                body: "{$user->name} غيّر حالة المهمة '{$task->title}' إلى {$statusName}",
                data: ['project_id' => $project->id, 'task_id' => $task->id, 'new_status' => $task->status, 'url' => "/dashboard/projects/{$project->id}"]
            );
        }

        return [
            'status' => 200, 
            'task' => $task, 
            'new_progress' => $this->calculateProjectProgress($project->id)
        ];
    }

    public function deleteTask($taskId, $user)
    {
        $task = Task::query()->whereKey($taskId)->first();
        if (!$task) return ['status' => 404, 'message' => 'Task not found'];

        $projectId = $task->project_id;
        $project = Project::query()->whereKey($projectId)->first();
        
        // 1. تحديد الصلاحيات المختلفة
        $isOwner = (int)$project->user_id === (int)$user->id;
        $isSupervisor = (int)$project->supervisor_id === (int)$user->id;
        
        // التحقق مما إذا كان الطالب عضواً مقبولاً في المشروع
        $isMember = \Illuminate\Support\Facades\DB::table('project_members')
            ->join('projects', 'project_members.project_id', '=', 'projects.id')
            ->where('projects.id', $project->id)
            ->where('projects.university_id', $user->university_id)
            ->where('project_members.student_id', $user->id)
            ->where('project_members.status', 'accepted')
            ->exists();

        // 2. إذا لم يكن يملك أي صفة من الصفات الثلاث، نمنع الحذف
        if (!$isOwner && !$isSupervisor && !$isMember) {
            return ['status' => 403, 'message' => 'Unauthorized'];
        }

        // 🎯 3. تسجيل عملية الحذف قبل مسح المهمة من قاعدة البيانات
        ProjectActivity::create([
            'project_id' => $projectId,
            'user_id' => $user->id,
            'action' => "حذف المهمة: {$task->title}",
            'type' => 'update' // سيظهر باللون البرتقالي/التحذيري
        ]);

        $task->delete();

        return [
            'status' => 200, 
            'message' => 'Task deleted successfully', 
            'new_progress' => $this->calculateProjectProgress($projectId)
        ];
    }
    
    /**
     * جلب إحصائيات سريعة للمشروع (مهام، إنجاز، تواريخ)
     */
    public function getProjectStats($projectId)
    {
        $tasks = Task::query()->where('project_id', $projectId)->get();
        $total = $tasks->count();
        $completed = $tasks->where('status', 'completed')->count();
        
        return [
            'total_tasks' => $total,
            'completed_tasks' => $completed,
            'progress_percent' => $total > 0 ? round(($completed / $total) * 100) : 0,
            'latest_activity' => $tasks->max('updated_at')
        ];
    }
}