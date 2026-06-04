<?php

namespace App\Repositories;

use App\Models\Task;

class TaskRepository
{
    // إنشاء مهمة جديدة
    public function create(array $data)
    {
        return Task::create($data);
    }

    // جلب جميع المهام لمشروع معيّن
    public function getByProjectId($projectId)
    {
        return Task::query()->where('project_id', $projectId)->get();
    }

    // جلب مهمة واحدة حسب ID
    public function find($id)
    {
        return Task::query()->find($id);
    }

    // تحديث مهمة
    public function update(Task $task, array $data)
    {
        $task->update($data);
        return $task;
    }

    // حذف مهمة
    public function delete(Task $task)
    {
        return $task->delete();
    }
}
