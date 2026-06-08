<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Create ideation_requests table for AI request analytics logs. */
    public function up(): void
    {
        Schema::create('ideation_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('interests_hash', 64);
            $table->enum('status', ['success', 'error', 'timeout']);
            $table->string('error_message', 255)->nullable();
            $table->unsignedInteger('response_time_ms')->nullable();
            $table->timestamp('created_at');

            $table->index('user_id');
            $table->index('created_at');
        });
    }

    /** Drop ideation_requests table. */
    public function down(): void
    {
        Schema::dropIfExists('ideation_requests');
    }
};
