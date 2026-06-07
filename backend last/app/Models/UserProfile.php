<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserProfile extends Model
{
    protected $fillable = [
        'user_id',
        'phone',
        'avatar',
        'university_name',
        'student_number',
    ];

    /** Returns the user who owns this profile. */
    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }

    /** Scopes profiles to the authenticated user's university. */
    public function scopeForCurrentUniversity($query)
    {
        if (!auth()->check() || !auth()->user()->university_id) {
            return $query->whereRaw('1 = 0');
        }

        return $query->whereHas('user', function ($q) {
            $q->where('university_id', auth()->user()->university_id);
        });
    }
}
