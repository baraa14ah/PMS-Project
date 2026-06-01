<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserProfile extends Model
{
    protected $fillable = [
        'user_id',
        'phone',
        'avatar',
        'university_name',
        'student_number',
      ];
      
      public function user()
      {
        return $this->belongsTo(\App\Models\User::class);
      }
      
}
