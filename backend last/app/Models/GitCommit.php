<?php

// app/Models/GitCommit.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GitCommit extends Model
{
    protected $table = 'git_commits';

    protected $fillable = [
        'project_id',
        'commit_hash',
        'author_name',
        'author_email',
        'message',
        'committed_at',
        'url',
      ];
      
    

    protected $casts = [
        'committed_at' => 'datetime',
    ];
}

