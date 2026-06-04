<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProjectActivity extends Model
{
    use HasFactory;

    protected $fillable = ['project_id', 'user_id', 'action', 'type'];

    // علاقة الحركة بصاحبها (لنجلب اسمه)
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

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