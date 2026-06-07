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

    /** Injects the project repository dependency. */
    public function __construct(ProjectRepository $projects)
    {
        $this->projects = $projects;
    }

    /** Creates a new project for the authenticated user. */
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

    /** Returns all projects visible to the given user. */
    public function listForUser($user)
    {
        return $this->projects->getForUser($user);
    }

    /** Returns projects for the index API with progress metrics attached. */
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

    /** Attaches task progress metrics to each project in the collection. */
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

    /** Updates a project if the user is authorized. */
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

    /** Deletes a project if the user is authorized. */
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

    /** Returns task progress stats and auto-updates project status. */
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

        $newStatus = 'pending';
        if ($totalTasks > 0 && $completedTasks === $totalTasks) {
            $newStatus = 'completed';
        } elseif ($completedTasks > 0 || $inProgressTasks > 0) {
            $newStatus = 'in_progress';
        }

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

    /** Returns a project with all related details loaded. */
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

    /** Delegates to progress() for controller compatibility. */
    public function calculateProgress(int $id): ?array
    {
        return $this->progress($id);
    }

    /** Returns students eligible for invitation to a project. */
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
