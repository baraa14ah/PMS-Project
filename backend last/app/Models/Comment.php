<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Comment extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'task_id',
        'user_id',
        'comment',
    ];

    /** Returns the user who wrote this comment. */
    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }

    /** Returns the project this comment belongs to. */
    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    /** Returns the task this comment belongs to. */
    public function task()
    {
        return $this->belongsTo(Task::class);
    }

    /** Scopes comments to the authenticated user's university. */
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
