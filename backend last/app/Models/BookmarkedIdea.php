<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BookmarkedIdea extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'suggestion_name',
        'suggestion_goal',
        'suggestion_technologies',
        'archived',
    ];

    protected $casts = [
        'suggestion_technologies' => 'array',
        'archived' => 'boolean',
    ];

    /** Returns the student who saved this bookmark. */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /** Scope to non-archived bookmarks only. */
    public function scopeActive($query)
    {
        return $query->where('archived', false);
    }

    /** Scope to archived bookmarks only. */
    public function scopeArchived($query)
    {
        return $query->where('archived', true);
    }
}
