<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
  public function up(): void
  {
    Schema::create('user_profiles', function (Blueprint $table) {
      $table->id();
      $table->foreignId('user_id')->unique()->constrained('users')->onDelete('cascade');

      $table->string('phone')->nullable();                 // اختياري للجميع
      $table->string('avatar')->nullable();                // رابط/مسار صورة

      // حقول الطالب فقط (ممكن تبقى null لغير الطالب)
      $table->string('university_name')->nullable();
      $table->string('student_number')->nullable();

      $table->timestamps();
    });
  }

  public function down(): void
  {
    Schema::dropIfExists('user_profiles');
  }
};

