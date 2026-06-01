<?php

namespace App\Repositories;

use App\Models\Rating;

class RatingRepository
{
    public function create(array $data)
    {
        return Rating::create($data);
    }

    public function findByUserAndProject($userId, $projectId)
    {
        return Rating::where('user_id', $userId)
                     ->where('project_id', $projectId)
                     ->first();
    }

    public function getProjectRatings($projectId)
    {
        return Rating::with('user')
            ->where('project_id', $projectId)
            ->latest()
            ->get();
    }

    public function delete(Rating $rating)
    {
        return $rating->delete();
    }
}
