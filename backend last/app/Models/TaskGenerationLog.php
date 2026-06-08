<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TaskGenerationLog extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'project_id',
        'status',
        'task_count',
        'response_time_ms',
        'error_message',
        'created_at',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    /** Returns the user who made this request. */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /** Returns the project this request was for. */
    public function project()
    {
        return $this->belongsTo(Project::class);
    }
}
