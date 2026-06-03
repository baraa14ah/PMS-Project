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
        Schema::create('project_activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->onDelete('cascade'); // المشروع
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // الشخص الذي قام بالحركة
            $table->string('action'); // النص الذي سيظهر (مثلاً: إضافة مهمة جديدة)
            $table->string('type'); // نوع الحركة (مثلاً: create, complete, update) لتحديد اللون والأيقونة في الرياكت
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('project_activities');
    }
};
