<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role_id',

    ];
    public function role()
    {
        return $this->belongsTo(\App\Models\Role::class);
    }
    

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
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

public function projectsAsMember()
{
    return $this->belongsToMany(Project::class, 'project_user');
}

public function profile()
{
  return $this->hasOne(\App\Models\UserProfile::class);
}



}
