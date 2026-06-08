<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Create bookmarked_ideas table for saved AI suggestions. */
    public function up(): void
    {
        Schema::create('bookmarked_ideas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('suggestion_name', 100);
            $table->text('suggestion_goal');
            $table->json('suggestion_technologies');
            $table->boolean('archived')->default(false);
            $table->timestamps();

            $table->index('user_id');
            $table->index(['user_id', 'archived']);
        });
    }

    /** Drop bookmarked_ideas table. */
    public function down(): void
    {
        Schema::dropIfExists('bookmarked_ideas');
    }
};
