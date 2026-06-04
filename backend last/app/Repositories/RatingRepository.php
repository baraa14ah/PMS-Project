<?php

namespace App\Repositories;

use App\Models\Rating;

class RatingRepository
{
    public function create(array $data): Rating
    {
        return Rating::create($data);
    }

    public function findByUserAndProject(int $userId, int $projectId): ?Rating
    {
        return Rating::query()
            ->forCurrentUniversity()
            ->where('user_id', $userId)
            ->where('project_id', $projectId)
            ->first();
    }

    public function getProjectRatings(int $projectId)
    {
        return Rating::query()
            ->forCurrentUniversity()
            ->with('user')
            ->where('project_id', $projectId)
            ->latest()
            ->get();
    }

    public function find(int $id): ?Rating
    {
        return Rating::query()->forCurrentUniversity()->whereKey($id)->first();
    }

    public function delete(Rating $rating): bool
    {
        return (bool) $rating->delete();
    }
}
