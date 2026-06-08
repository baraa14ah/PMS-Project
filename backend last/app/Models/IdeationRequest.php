<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IdeationRequest extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'interests_hash',
        'status',
        'error_message',
        'response_time_ms',
        'created_at',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    /** Returns the student who made this AI request. */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
