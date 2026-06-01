<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\GitCommit;



class Project extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'github_repo_url',
        'user_id',
        'status',
        'supervisor_id',
    ];
    
    /**
 * العلاقة بين المشروع والتعليقات
 */
public function comments()
{
    // المشروع الواحد له العديد من التعليقات
    return $this->hasMany(\App\Models\Comment::class);
}

    public function user()
    {
        return $this->belongsTo(User::class);
    }


    
    public function tasks()
{
    return $this->hasMany(Task::class);
}


public function supervisor()
{
    return $this->belongsTo(User::class, 'supervisor_id');
    
}  


public function commits()
{
    return $this->hasMany(GitCommit::class);
}


public function versions()
{
    return $this->hasMany(ProjectVersion::class);
}

public function students()
{
    return $this->belongsToMany(User::class, 'project_user');
}




public function members()
    {
       
        return $this->belongsToMany(User::class, 'project_members', 'project_id', 'student_id')
                    ->withPivot('status') 
                    ->withTimestamps();
    }


 

}
