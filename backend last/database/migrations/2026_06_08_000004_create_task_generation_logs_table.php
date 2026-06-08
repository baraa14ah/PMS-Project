<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('task_generation_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('project_id')->constrained()->onDelete('cascade');
            $table->enum('status', ['success', 'error', 'timeout']);
            $table->unsignedTinyInteger('task_count')->nullable();
            $table->unsignedInteger('response_time_ms')->nullable();
            $table->string('error_message', 255)->nullable();
            $table->timestamp('created_at');

            $table->index('user_id');
            $table->index('project_id');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('task_generation_logs');
    }
};
