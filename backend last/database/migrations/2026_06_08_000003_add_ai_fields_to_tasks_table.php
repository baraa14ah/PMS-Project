<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->unsignedTinyInteger('estimated_hours')->nullable()->after('deadline');
            $table->boolean('ai_generated')->default(false)->after('estimated_hours');
            $table->index(['project_id', 'ai_generated']);
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropIndex(['project_id', 'ai_generated']);
            $table->dropColumn(['estimated_hours', 'ai_generated']);
        });
    }
};
