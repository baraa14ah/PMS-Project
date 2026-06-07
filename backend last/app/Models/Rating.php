<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Rating extends Model
{
    protected $fillable = [
        'user_id', 'project_id', 'rating'
    ];

    /** Returns the user who submitted this rating. */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /** Returns the project this rating applies to. */
    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    /** Scopes ratings to the authenticated user's university. */
    public function scopeForCurrentUniversity($query)
    {
        if (!auth()->check() || !auth()->user()->university_id) {
            return $query->whereRaw('1 = 0');
        }

        return $query->whereHas('project', function ($q) {
            $q->where('university_id', auth()->user()->university_id);
        });
    }
}
