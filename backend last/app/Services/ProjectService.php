<?php

namespace App\Services;

use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use App\Services\StudentService;
use App\Repositories\ProjectRepository;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

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
        $data['university_id'] = $request->user()->university_id;
        $data['status']  = 'pending';

        return $this->projects->create($data);
    }

    public function listForUser($user)
    {
        return $this->projects->getForUser($user);
    }

    /** Projects for index API with progress in one query (no N+1). */
    public function listForIndex(User $user): Collection
    {
        $roleName = strtolower($user->role?->name ?? '');
        $query = Project::query()->with(['user:id,name,email', 'supervisor:id,name,email']);

        if ($roleName === 'super_admin') {
            $query->with('university:id,name');
        } elseif ($roleName === 'supervisor' || $roleName === 'manager') {
            $query->where('supervisor_id', $user->id);
        } elseif ($roleName === 'student') {
            $query->where(function (Builder $q) use ($user) {
                $q->where('user_id', $user->id)
                    ->orWhereHas('members', function (Builder $memberQ) use ($user) {
                        $memberQ->where('users.id', $user->id)
                            ->where('project_members.status', 'accepted');
                    });
            });
        }

        $projects = $query->orderByDesc('created_at')->get();

        return $this->attachProgressMetrics($projects);
    }

    public function attachProgressMetrics(Collection $projects): Collection
    {
        if ($projects->isEmpty()) {
            return $projects;
        }

        $ids = $projects->pluck('id');
        $counts = Task::query()
            ->whereIn('project_id', $ids)
            ->selectRaw('project_id')
            ->selectRaw('COUNT(*) as total_tasks')
            ->selectRaw("SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks")
            ->groupBy('project_id')
            ->get()
            ->keyBy('project_id');

        return $projects->map(function (Project $project) use ($counts) {
            $row = $counts->get($project->id);
            $total = (int) ($row->total_tasks ?? 0);
            $completed = (int) ($row->completed_tasks ?? 0);

            $project->setAttribute('total_tasks', $total);
            $project->setAttribute('completed_tasks', $completed);
            $project->setAttribute(
                'progress_percentage',
                $total > 0 ? round(($completed / $total) * 100, 2) : 0,
            );

            return $project;
        });
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
        $project = Project::query()->with('tasks')->whereKey($id)->first();

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
        return Project::query()->with([
            'user:id,name,email',
            'supervisor:id,name,email',
            'tasks',
            'comments.user:id,name',
            'versions.user:id,name',
            'members'
        ])->whereKey($id)->first();
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
    public function getAvailableStudentsForInvite(int $projectId, ?string $search = null)
    {
        $students = app(StudentService::class)->getAvailableStudents($projectId, $search);

        return $students
            ->map(fn ($user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'student_number' => $user->student_number,
                'university_id' => $user->university_id,
            ])
            ->values();
    }
}