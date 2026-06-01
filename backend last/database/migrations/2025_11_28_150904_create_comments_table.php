<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
   public function up()
{
    Schema::create('comments', function (Blueprint $table) {
        $table->id();
        $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
        $table->foreignId('project_id')->nullable()->constrained('projects')->cascadeOnDelete();
        $table->foreignId('task_id')->nullable()->constrained('tasks')->cascadeOnDelete();

        $table->text('comment');
        $table->timestamps();
    });
}

public function down()
{
    Schema::dropIfExists('comments');
}

};
