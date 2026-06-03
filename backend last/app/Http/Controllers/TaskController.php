<?php

namespace App\Http\Controllers;
use Illuminate\Http\Request;
use App\Services\TaskService;

class TaskController extends Controller
{
    protected TaskService $taskService;

    public function __construct(TaskService $taskService)
    {
        $this->taskService = $taskService;
    }

    public function getProjectTasks(Request $request, $projectId)
    {
        $result = $this->taskService->getProjectTasks($projectId, $request->user());
        if ($result['status'] !== 200) return response()->json(['message' => $result['message']], $result['status']);

        return response()->json([
            'tasks' => $result['tasks'],
            'progress' => $this->taskService->calculateProjectProgress($projectId)
        ]);
    }

    public function create(Request $request)
    {
        $validatedData = $request->validate([
            'project_id'  => 'required|integer|exists:projects,id',
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string',
            'deadline'    => 'nullable|date|date_format:Y-m-d',
        ]);

        $result = $this->taskService->createTask($validatedData, $request->user());
        if ($result['status'] !== 201) return response()->json(['message' => $result['message']], $result['status']);

        return response()->json([
            'message' => 'Task created successfully',
            'task'    => $result['task'],
            'new_progress' => $result['new_progress']
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $validatedData = $request->validate([
            'title'       => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'deadline'    => 'nullable|date',
            'status'      => 'sometimes|in:pending,in_progress,completed',
        ]);

        $result = $this->taskService->updateTask($id, $validatedData, $request->user());
        if ($result['status'] !== 200) return response()->json(['message' => $result['message']], $result['status']);

        return response()->json([
            'message' => 'Task updated successfully',
            'task'    => $result['task'],
            'new_progress' => $result['new_progress']
        ]);
    }

    public function delete(Request $request, $id)
    {
        $result = $this->taskService->deleteTask($id, $request->user());
        if ($result['status'] !== 200) return response()->json(['message' => $result['message']], $result['status']);

        return response()->json([
            'message' => $result['message'],
            'new_progress' => $result['new_progress']
        ]);
    }
}