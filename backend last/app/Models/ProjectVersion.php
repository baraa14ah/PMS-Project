<?php

namespace App\Models;
use App\Models\Task;


use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProjectVersion extends Model
{
        public $timestamps = true; // 🔥 مهم جداً

    protected $fillable = [
        'project_id',
        'user_id',
        'version_title',
        'version_description',
        'file_path',
        'task_id',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function task()
    {
        return $this->belongsTo(Task::class);
    }
}
