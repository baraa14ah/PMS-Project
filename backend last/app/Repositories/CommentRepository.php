<?php

namespace App\Repositories;

use App\Models\Comment;

class CommentRepository
{
    /** Create and persist a new comment. */
    public function create(array $data): Comment
    {
        return Comment::create($data);
    }

    /** Get all comments for the given project. */
    public function getProjectComments(int $projectId)
    {
        return Comment::query()->forCurrentUniversity()
            ->where('project_id', $projectId)
            ->with('user')
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /** Get all comments for the given task. */
    public function getTaskComments(int $taskId)
    {
        return Comment::query()->forCurrentUniversity()
            ->where('task_id', $taskId)
            ->with('user')
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /** Find a comment by ID within the current university. */
    public function find(int $id): ?Comment
    {
        return Comment::query()->forCurrentUniversity()->whereKey($id)->first();
    }

    /** Update the given comment with the provided data. */
    public function update(Comment $comment, array $data): Comment
    {
        $comment->update($data);
        return $comment;
    }

    /** Delete the given comment. */
    public function delete(Comment $comment)
    {
        return $comment->delete();
    }
}
