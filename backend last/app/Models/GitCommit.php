<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GitCommit extends Model
{
    protected $table = 'git_commits';

    protected $fillable = [
        'project_id',
        'commit_hash',
        'author_name',
        'author_email',
        'message',
        'committed_at',
        'url',
    ];

    protected $casts = [
        'committed_at' => 'datetime',
    ];

    /** Returns the project this commit belongs to. */
    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    /** Scopes commits to the authenticated user's university. */
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
