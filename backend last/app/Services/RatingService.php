<?php

namespace App\Services;

use App\Models\Project;
use App\Models\Rating;
use App\Repositories\RatingRepository;
use Illuminate\Http\Request;

class RatingService
{
    protected RatingRepository $ratings;

    /** Injects the rating repository dependency. */
    public function __construct(RatingRepository $ratings)
    {
        $this->ratings = $ratings;
    }

    /** Creates a rating for a project or returns an error indicator. */
    public function rateProject(Request $request, int $projectId)
    {
        $project = Project::query()->whereKey($projectId)->first();
        if (!$project) {
            return 'not_found';
        }

        $existing = $this->ratings->findByUserAndProject(
            $request->user()->id,
            $projectId
        );

        if ($existing) {
            return 'already_rated';
        }

        return $this->ratings->create([
            'rating'     => $request->rating,
            'user_id'    => $request->user()->id,
            'project_id' => $projectId,
        ]);
    }

    /** Deletes a rating by ID and returns whether it succeeded. */
    public function delete(int $id): bool
    {
        $rating = $this->ratings->find($id);

        if (!$rating) {
            return false;
        }

        return $this->ratings->delete($rating);
    }
}
