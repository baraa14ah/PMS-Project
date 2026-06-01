<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'status',
        'deadline',
        'project_id',
        'assigned_to'
    ];

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
