<?php

namespace App\Repositories;

use App\Models\Rating;

class RatingRepository
{
    /** Create and persist a new rating. */
    public function create(array $data): Rating
    {
        return Rating::create($data);
    }

    /** Find a rating by user and project within the current university. */
    public function findByUserAndProject(int $userId, int $projectId): ?Rating
    {
        return Rating::query()
            ->forCurrentUniversity()
            ->where('user_id', $userId)
            ->where('project_id', $projectId)
            ->first();
    }

    /** Get all ratings for the given project. */
    public function getProjectRatings(int $projectId)
    {
        return Rating::query()
            ->forCurrentUniversity()
            ->with('user')
            ->where('project_id', $projectId)
            ->latest()
            ->get();
    }

    /** Find a rating by ID within the current university. */
    public function find(int $id): ?Rating
    {
        return Rating::query()->forCurrentUniversity()->whereKey($id)->first();
    }

    /** Delete the given rating. */
    public function delete(Rating $rating): bool
    {
        return (bool) $rating->delete();
    }
}
