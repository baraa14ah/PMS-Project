<?php


use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
  public function up(): void {
    Schema::table('projects', function (Blueprint $table) {
      $table->string('github_repo_url')->nullable()->change(); // إذا موجود أصلاً
      $table->string('github_branch')->nullable()->default('main');
      $table->timestamp('github_last_synced_at')->nullable();
    });
  }

  public function down(): void {
    Schema::table('projects', function (Blueprint $table) {
      $table->dropColumn(['github_branch','github_last_synced_at']);
    });
  }
};
