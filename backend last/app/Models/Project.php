<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\GitCommit;
use App\Models\Concerns\BelongsToUniversity;

class Project extends Model
{
    use HasFactory, BelongsToUniversity;

    protected $fillable = [
        'title',
        'description',
        'github_repo_url',
        'user_id',
        'status',
        'supervisor_id',
        'university_id',
    ];

    /** Returns comments posted on this project. */
    public function comments()
    {
        return $this->hasMany(\App\Models\Comment::class);
    }

    /** Returns the user who owns this project. */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /** Returns tasks associated with this project. */
    public function tasks()
    {
        return $this->hasMany(Task::class);
    }

    /** Returns the supervisor assigned to this project. */
    public function supervisor()
    {
        return $this->belongsTo(User::class, 'supervisor_id');
    }

    /** Returns git commits linked to this project. */
    public function commits()
    {
        return $this->hasMany(GitCommit::class);
    }

    /** Returns version snapshots for this project. */
    public function versions()
    {
        return $this->hasMany(ProjectVersion::class);
    }

    /** Returns students linked via the project_user pivot. */
    public function students()
    {
        return $this->belongsToMany(User::class, 'project_user');
    }

    /** Returns project members with pivot status and timestamps. */
    public function members()
    {
        return $this->belongsToMany(User::class, 'project_members', 'project_id', 'student_id')
                    ->withPivot('status')
                    ->withTimestamps();
    }
}
