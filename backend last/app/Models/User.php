<?php

namespace App\Models;

use App\Models\Concerns\HasUniversityVisibility;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, HasUniversityVisibility;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role_id',
        'university_id',
        'student_number',
        'status',
    ];

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isRejected(): bool
    {
        return $this->status === 'rejected';
    }

    public function isSuperAdmin(): bool
    {
        return $this->role && $this->role->name === 'super_admin';
    }

    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    public function university()
    {
        return $this->belongsTo(University::class);
    }

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    public function projects()
    {
        return $this->belongsToMany(Project::class, 'project_members', 'student_id', 'project_id')
            ->withPivot('status')
            ->withTimestamps();
    }

    public function assignedTasks()
    {
        return $this->hasMany(Task::class, 'assigned_to');
    }

    public function supervisedProjects()
    {
        return $this->hasMany(Project::class, 'supervisor_id');
    }

    /** @deprecated استخدم projects() — الجدول الصحيح project_members */
    public function projectsAsMember()
    {
        return $this->projects();
    }

    public function profile()
    {
        return $this->hasOne(UserProfile::class);
    }
}
