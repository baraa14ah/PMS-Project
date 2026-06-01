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

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function sender()
    {
        return $this->belongsTo(User::class, 'sent_by_id');
    }
}
