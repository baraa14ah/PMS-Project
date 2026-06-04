<?php

namespace App\Http\Controllers;

use App\Models\StudentInvitation;
use App\Models\SupervisorInvitation;
use App\Models\Task;
use App\Services\InvitationService;
use App\Services\PasswordResetHelpService;
use App\Services\ProjectService;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __construct(
        protected ProjectService $projectService,
        protected InvitationService $invitationService,
        protected PasswordResetHelpService $passwordResetHelp,
    ) {}

    public function summary(Request $request)
    {
        $user = $request->user();
        $user->loadMissing('role');
        $roleName = strtolower($user->role?->name ?? '');

        $projects = $this->projectService->listForIndex($user);
        $projectIds = $projects->pluck('id');

        $tasksTotal = (int) $projects->sum('total_tasks');
        $tasksCompleted = (int) $projects->sum('completed_tasks');

        $recentTasks = collect();
        if ($projectIds->isNotEmpty()) {
            $recentTasks = Task::query()
                ->whereIn('project_id', $projectIds)
                ->with('project:id,title')
                ->orderByDesc('updated_at')
                ->limit(12)
                ->get()
                ->map(fn (Task $t) => [
                    'id'            => $t->id,
                    'title'         => $t->title,
                    'status'        => $t->status,
                    'project_id'    => $t->project_id,
                    'project_title' => $t->project?->title,
                    'updated_at'    => $t->updated_at,
                ]);
        }

        return response()->json([
            'stats' => [
                'projects_total'   => $projects->count(),
                'tasks_total'      => $tasksTotal,
                'tasks_completed'  => $tasksCompleted,
                'progress'         => $tasksTotal > 0
                    ? round(($tasksCompleted / $tasksTotal) * 100, 1)
                    : 0,
                'pending_invites'  => $this->pendingInvitesCount($user, $roleName),
            ],
            'recent_projects' => $projects->take(6)->values(),
            'recent_tasks'    => $recentTasks->take(6)->values(),
        ]);
    }

    public function badges(Request $request)
    {
        $user = $request->user();
        $user->loadMissing('role');
        $roleName = strtolower($user->role?->name ?? '');

        $passwordResetRequests = 0;
        if ($roleName === 'admin' && $user->university_id) {
            $passwordResetRequests = $this->passwordResetHelp->pendingCountForUniversity(
                (int) $user->university_id,
            );
        }

        return response()->json([
            'unread_notifications' => (int) $user->unreadNotifications()->count(),
            'student_invitations'  => $this->studentInvitesCount($user, $roleName),
            'supervisor_invitations' => $this->supervisorInvitesCount($user, $roleName),
            'password_reset_requests' => $passwordResetRequests,
        ]);
    }

    private function pendingInvitesCount($user, string $roleName): int
    {
        return $this->studentInvitesCount($user, $roleName)
            + $this->supervisorInvitesCount($user, $roleName);
    }

    private function studentInvitesCount($user, string $roleName): int
    {
        if (!in_array($roleName, ['student', 'admin'], true)) {
            return 0;
        }

        if ($roleName === 'student') {
            return $this->invitationService->getStudentInvitations($user->id)->count();
        }

        return StudentInvitation::query()
            ->forCurrentUniversity()
            ->where('status', 'pending')
            ->count();
    }

    private function supervisorInvitesCount($user, string $roleName): int
    {
        if (!in_array($roleName, ['supervisor', 'admin'], true)) {
            return 0;
        }

        if ($roleName === 'supervisor') {
            return $this->invitationService->getSupervisorInvitations($user->id)->count();
        }

        return SupervisorInvitation::query()
            ->forCurrentUniversity()
            ->where('status', 'pending')
            ->count();
    }
}
