<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'type',
        'title',
        'body',
        'data',
        'read_at',
    ];

    protected $casts = [
        'data' => 'array',
        'read_at' => 'datetime',
    ];

    /**
     * الإشعار يعود لمستخدم واحد
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function scopeForCurrentUniversity($query)
    {
        if (!auth()->check() || !auth()->user()->university_id) {
            return $query->whereRaw('1 = 0');
        }

        return $query->whereHas('user', function ($q) {
            $q->where('university_id', auth()->user()->university_id);
        });
    }
}
