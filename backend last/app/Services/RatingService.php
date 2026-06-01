<?php

namespace App\Services;

use App\Repositories\RatingRepository;
use Illuminate\Http\Request;
use App\Models\Rating;

class RatingService
{protected $ratings;

    public function __construct(RatingRepository $ratings)
    {
        $this->ratings = $ratings;
    }

    public function rateProject(Request $request, $projectId)
    {
        // إذا كان المستخدم قيّم المشروع قبل → نمنع
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

    public function delete(Rating $rating)
    {
        return $this->ratings->delete($rating);
    }
}
