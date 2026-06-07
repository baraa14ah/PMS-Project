<?php

namespace App\Http\Controllers;

use App\Models\Project;
use Illuminate\Http\Request;
use App\Services\ProjectService;
use App\Services\GithubService;

class ProjectController extends Controller
{
    protected ProjectService $projectService;
    protected GithubService $githubService;

    /** Initialize the controller with project and GitHub services. */
    public function __construct(ProjectService $projectService, GithubService $githubService)
    {
        $this->projectService = $projectService;
        $this->githubService = $githubService;
    }

    /** List projects visible to the authenticated user. */
    public function index(Request $request)
    {
        $user = $request->user();
        $user->loadMissing('role');

        $projects = $this->projectService->listForIndex($user);

        return response()->json(['projects' => $projects]);
    }

    /** Return full details and stats for a project. */
    public function show(Request $request, $id)
    {
        $project = $this->projectService->getProjectFullDetails((int)$id);

        if (!$project) return response()->json(['message' => 'Project not found'], 404);

        $stats = $this->projectService->calculateProgress((int)$id);

        return response()->json([
            'project' => $project,
            'stats' => $stats
        ]);
    }

    /** Create a new project. */
    public function create(Request $request)
    {
        $project = $this->projectService->create($request);

        return response()->json([
            'message' => 'تم إنشاء المشروع بنجاح',
            'project' => $project
        ], 201);
    }

    /** Update an existing project. */
    public function update(Request $request, $id)
    {
        $result = $this->projectService->update($request, (int)$id, $request->user());

        if ($result === 'unauthorized') {
            return response()->json(['message' => 'غير مصرح لك بتعديل هذا المشروع'], 403);
        }

        if (!$result) {
            return response()->json(['message' => 'المشروع غير موجود'], 404);
        }

        return response()->json([
            'message' => 'تم تعديل المشروع بنجاح',
            'project' => $result
        ]);
    }

    /** Delete a project. */
    public function delete(Request $request, $id)
    {
        $result = $this->projectService->delete((int)$id, $request->user());

        if ($result === 'unauthorized') {
            return response()->json(['message' => 'غير مصرح لك بحذف هذا المشروع'], 403);
        }

        if (!$result) {
            return response()->json(['message' => 'المشروع غير موجود'], 404);
        }

        return response()->json(['message' => 'تم حذف المشروع بنجاح']);
    }

    /** Route alias that delegates to delete. */
    public function destroy(Request $request, $id)
    {
        return $this->delete($request, $id);
    }

    /** Remove the current supervisor from a project. */
    public function leaveSupervision(Request $request, $id)
    {
        $project = \App\Models\Project::query()->whereKey($id)->firstOrFail();

        $user = $request->user();

        if ($project->supervisor_id !== $user->id) {
            return response()->json(['message' => 'غير مصرح لك بإلغاء الإشراف'], 403);
        }

        $project->supervisor_id = null;
        $project->save();

        return response()->json(['message' => 'تم إلغاء الإشراف بنجاح']);
    }

    /** Return task progress stats for a project. */
    public function progress(Request $request, $id)
    {
        $stats = $this->projectService->calculateProgress((int)$id);
        if (!$stats) {
            return response()->json(['message' => 'المشروع غير موجود'], 404);
        }
        return response()->json($stats);
    }

    /** List students available for project invitation. */
    public function students(Request $request, int $id)
    {
        $students = $this->projectService->getAvailableStudentsForInvite(
            $id,
            $request->get('search'),
        );

        return response()->json(['students' => $students]);
    }

    /** Return activity log entries for a project. */
    public function getActivities($id)
    {
        $project = \App\Models\Project::query()->whereKey($id)->first();
        if (!$project) {
            return response()->json(['message' => 'Project not found'], 404);
        }

        $activities = \App\Models\ProjectActivity::query()
            ->forCurrentUniversity()
            ->with('user:id,name')
            ->where('project_id', $id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'status' => 'success',
            'activities' => $activities,
        ]);
    }
}
