<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
  public function up()
{
    Schema::create('ratings', function (Blueprint $table) {
        $table->id();
        $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
        $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
        $table->tinyInteger('rating'); // من 1 إلى 5
        $table->timestamps();
    });
}

public function down()
{
    Schema::dropIfExists('ratings');
}

};
