<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class University extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'slug', 'is_active'];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public static function defaultId(): int
    {
        return self::where('name', env('DEFAULT_UNIVERSITY_NAME', 'Legacy'))->firstOrFail()->id;
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
