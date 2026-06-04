<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::statement('ALTER TABLE users MODIFY university_id BIGINT UNSIGNED NOT NULL');
        DB::statement('ALTER TABLE projects MODIFY university_id BIGINT UNSIGNED NOT NULL');

        if (Schema::hasColumn('tasks', 'university_id')) {
            DB::statement('ALTER TABLE tasks MODIFY university_id BIGINT UNSIGNED NOT NULL');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('ALTER TABLE users MODIFY university_id BIGINT UNSIGNED NULL');
        DB::statement('ALTER TABLE projects MODIFY university_id BIGINT UNSIGNED NULL');

        if (Schema::hasColumn('tasks', 'university_id')) {
            DB::statement('ALTER TABLE tasks MODIFY university_id BIGINT UNSIGNED NULL');
        }
    }
};
