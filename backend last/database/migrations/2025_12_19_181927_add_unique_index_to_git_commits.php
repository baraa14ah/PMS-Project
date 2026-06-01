<?php

// database/migrations/xxxx_add_unique_index_to_git_commits.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
  public function up(): void {
    Schema::table('git_commits', function (Blueprint $table) {
      $table->unique(['project_id', 'commit_hash']);
      $table->index(['project_id', 'committed_at']);
    });
  }

  public function down(): void {
    Schema::table('git_commits', function (Blueprint $table) {
      $table->dropUnique(['project_id','commit_hash']);
      $table->dropIndex(['project_id','committed_at']);
    });
  }
};
