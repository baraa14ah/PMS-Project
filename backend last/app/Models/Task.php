<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\BelongsToUniversity;

class Task extends Model
{
    use HasFactory, BelongsToUniversity;

    protected $fillable = [
        'title',
        'description',
        'status',
        'deadline',
        'project_id',
        'assigned_to',
        'university_id',
    ];

    protected static function booted()
    {
        static::creating(function ($task) {
            if ($task->project_id && empty($task->university_id)) {
                $task->university_id = $task->project->university_id;
            }
        });

        static::updating(function ($task) {
            if ($task->isDirty('project_id') && $task->project_id) {
                $task->university_id = $task->project->university_id;
            }
        });
    }

    // المهمة تابعة لمشروع
    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    // الطالب المعين للمهمة
    public function assignedTo()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
