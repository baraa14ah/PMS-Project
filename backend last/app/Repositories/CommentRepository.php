<?php

namespace App\Repositories;

use App\Models\Comment;

class CommentRepository
{
    public function create(array $data): Comment
    {
        return Comment::create($data);
    }

    public function getProjectComments(int $projectId)
    {
        return Comment::query()->forCurrentUniversity()
            ->where('project_id', $projectId)
            ->with('user')
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function getTaskComments(int $taskId)
    {
        return Comment::query()->forCurrentUniversity()
            ->where('task_id', $taskId)
            ->with('user')
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function find(int $id): ?Comment
    {
        return Comment::query()->forCurrentUniversity()->whereKey($id)->first();
    }

    public function update(Comment $comment, array $data): Comment
    {
        $comment->update($data);
        return $comment;
    }

    public function delete(Comment $comment)
    {
        return $comment->delete();
    }
}
