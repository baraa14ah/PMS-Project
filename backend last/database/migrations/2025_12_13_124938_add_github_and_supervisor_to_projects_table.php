<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            if (!Schema::hasColumn('projects', 'github_repo_url')) {
                $table->string('github_repo_url')->nullable()->after('description');
            }

            if (!Schema::hasColumn('projects', 'supervisor_id')) {
                $table->foreignId('supervisor_id')
                    ->nullable()
                    ->constrained('users')
                    ->nullOnDelete()
                    ->after('user_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            if (Schema::hasColumn('projects', 'supervisor_id')) {
                $table->dropConstrainedForeignId('supervisor_id');
            }

            if (Schema::hasColumn('projects', 'github_repo_url')) {
                $table->dropColumn('github_repo_url');
            }
        });
    }
};
