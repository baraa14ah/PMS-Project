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
}