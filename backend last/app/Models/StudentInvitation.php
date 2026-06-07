<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentInvitation extends Model
{
    protected $fillable = [
        'project_id',
        'student_id',
        'sent_by_id',
        'status',
    ];

    /** Returns the project this invitation targets. */
    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    /** Returns the invited student. */
    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    /** Returns the user who sent this invitation. */
    public function sender()
    {
        return $this->belongsTo(User::class, 'sent_by_id');
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
