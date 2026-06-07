<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SupervisorInvitation extends Model
{
    protected $fillable = [
        'project_id', 'student_id', 'supervisor_id', 'status',
    ];

    /** Returns the project this invitation targets. */
    public function project()
    {
        return $this->belongsTo(\App\Models\Project::class);
    }

    /** Returns the student associated with this invitation. */
    public function student()
    {
        return $this->belongsTo(\App\Models\User::class, 'student_id');
    }

    /** Returns the supervisor associated with this invitation. */
    public function supervisor()
    {
        return $this->belongsTo(\App\Models\User::class, 'supervisor_id');
    }

    /** Scopes invitations to the authenticated user's university. */
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
