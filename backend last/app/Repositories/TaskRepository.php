<?php

namespace App\Repositories;

use App\Models\Task;

class TaskRepository
{
    /** Create and persist a new task. */
    public function create(array $data)
    {
        return Task::create($data);
    }

    /** Get all tasks belonging to the given project. */
    public function getByProjectId($projectId)
    {
        return Task::query()->where('project_id', $projectId)->get();
    }

    /** Find a task by ID. */
    public function find($id)
    {
        return Task::query()->find($id);
    }

    /** Update the given task with the provided data. */
    public function update(Task $task, array $data)
    {
        $task->update($data);
        return $task;
    }

    /** Delete the given task. */
    public function delete(Task $task)
    {
        return $task->delete();
    }
}
