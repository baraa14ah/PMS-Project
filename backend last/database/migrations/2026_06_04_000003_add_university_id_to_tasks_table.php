<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private function tasksUniversityForeignKeyExists(): bool
    {
        return DB::table('information_schema.KEY_COLUMN_USAGE')
            ->where('TABLE_SCHEMA', DB::getDatabaseName())
            ->where('TABLE_NAME', 'tasks')
            ->where('COLUMN_NAME', 'university_id')
            ->whereNotNull('REFERENCED_TABLE_NAME')
            ->exists();
    }

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasColumn('tasks', 'university_id')) {
            Schema::table('tasks', function (Blueprint $table) {
                $table->unsignedBigInteger('university_id')->nullable();
            });
        }

        if ($this->tasksUniversityForeignKeyExists()) {
            return;
        }

        Schema::table('tasks', function (Blueprint $table) {
            $table->foreign('university_id', 'tasks_university_id_foreign')
                ->references('id')
                ->on('universities');
            $table->index('university_id', 'tasks_university_id_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropConstrainedForeignId('university_id');
        });
    }
};
