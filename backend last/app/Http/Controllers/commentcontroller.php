<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Project;
use App\Models\Task;
use App\Services\CommentService;
use Illuminate\Support\Facades\DB;

class CommentController extends Controller
{
    protected CommentService $commentService;

    public function __construct(CommentService $commentService)
    {
        $this->commentService = $commentService;
    }

    // دالة مساعدة لفحص الصلاحية العامة للمشروع
    private function checkAccess($user, $projectId) {
        $project = Project::find($projectId);
        if (!$project) return false;
        
        $role = $user->role?->name ?? $user->role;
        $isMember = DB::table('project_members')
            ->where('project_id', $projectId)
            ->where('student_id', $user->id)
            ->exists();

        return $role === 'admin' || $project->user_id === $user->id || $project->supervisor_id === $user->id || $isMember;
    }

    public function storeProjectComment(Request $request, $projectId)
    {
        if (!$this->checkAccess($request->user(), $projectId)) return response()->json(['message' => 'Unauthorized'], 403);
        
        $request->validate(['comment' => 'required|string']);
        $comment = $this->commentService->addProjectComment($projectId, $request->comment, $request->user());
        
        return response()->json(['message' => 'Comment added', 'comment' => $comment], 201);
    }

    public function projectComments(Request $request, $projectId)
    {
        if (!$this->checkAccess($request->user(), $projectId)) return response()->json(['message' => 'Unauthorized'], 403);
        
        $comments = $this->commentService->getProjectComments($projectId);
        return response()->json(['comments' => $comments]);
    }

    public function storeTaskComment(Request $request, $taskId)
    {
        $task = Task::findOrFail($taskId);
        if (!$this->checkAccess($request->user(), $task->project_id)) return response()->json(['message' => 'Unauthorized'], 403);

        $request->validate(['comment' => 'required|string']);
        $comment = $this->commentService->addTaskComment($taskId, $request->comment, $request->user());
        
        return response()->json(['message' => 'Comment added', 'comment' => $comment], 201);
    }

    public function taskComments(Request $request, $taskId)
    {
        $task = Task::findOrFail($taskId);
        if (!$this->checkAccess($request->user(), $task->project_id)) return response()->json(['message' => 'Unauthorized'], 403);

        $comments = $this->commentService->getTaskComments($taskId);
        return response()->json(['comments' => $comments]);
    }

    public function update(Request $request, $id)
    {
        $request->validate(['comment' => 'required|string']);
        $result = $this->commentService->updateComment($id, $request->comment, $request->user());
        
        return response()->json($result, $result['status']);
    }

    public function delete(Request $request, $id)
    {
        $result = $this->commentService->deleteComment($id, $request->user());
        return response()->json($result, $result['status']);
    }
}