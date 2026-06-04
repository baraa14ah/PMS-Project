<?php

namespace App\Services;

use App\Models\Project;
use App\Models\User;
use App\Notifications\SystemNotification;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Facades\DB;

class NotificationService
{
    private function baseQuery(int $userId)
    {
        return DatabaseNotification::query()
            ->where('notifiable_id', $userId)
            ->where('notifiable_type', User::class);
    }

    public function getAll($user)
    {
        $items = $this->baseQuery($user->id)
            ->orderByDesc('created_at')
            ->paginate(15);

        return [
            'notifications' => $items->items(),
            'unread_count'  => $user->unreadNotifications()->count(),
            'meta' => [
                'current_page' => $items->currentPage(),
                'last_page'    => $items->lastPage(),
                'total'        => $items->total(),
            ],
        ];
    }

    public function markAsRead($user, $id = null)
    {
        if ($id) {
            // تحديث إشعار واحد مباشرة في الداتا بيز
            $user->unreadNotifications()->where('id', $id)->update(['read_at' => now()]);
        } else {
            // تحديث كل الإشعارات مباشرة في الداتا بيز (أقوى وأسرع)
            $user->unreadNotifications()->update(['read_at' => now()]);
        }

        return ['unread_count' => 0];
    }
    public function notifyUser(User $user, string $type, string $title, ?string $body = null, array $data = []): void
    {
        $user->notify(new SystemNotification($type, $title, $body, $data));
    }

    public function notifyProjectParticipants(int $projectId, int $actorUserId, string $type, string $title, ?string $body = null, array $data = []): void
    {
        $project = Project::query()->whereKey($projectId)->first();
        if (!$project) return;

        $ids = DB::table('project_members')
            ->join('projects', 'project_members.project_id', '=', 'projects.id')
            ->where('projects.id', $projectId)
            ->where('projects.university_id', auth()->user()->university_id ?? $project->university_id)
            ->where('project_members.status', 'accepted')
            ->pluck('project_members.student_id')
            ->toArray();

        $ids[] = $project->user_id;
        if ($project->supervisor_id) $ids[] = $project->supervisor_id;

        $targetIds = array_unique(array_filter($ids, fn($id) => $id != $actorUserId));

        if (empty($targetIds)) return;

        $users = User::query()->whereIn('id', $targetIds)->get();
        foreach ($users as $u) {
            $this->notifyUser($u, $type, $title, $body, $data);
        }
    }

    // ✅ دالة رديفة لمنع ظهور خطأ Undefined method notifyProject
    public function notifyProject(Project $project, string $type, string $title, string $body, array $data = [], int $ignoreUserId = null)
    {
        $this->notifyProjectParticipants($project->id, $ignoreUserId ?? 0, $type, $title, $body, $data);
    }
}