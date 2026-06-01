<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('student_invitations', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('project_id');
            $table->unsignedBigInteger('student_id');   // الطالب المدعو
            $table->unsignedBigInteger('sent_by_id');   // من أرسل الدعوة (مالك/مشرف/أدمن)
            $table->enum('status', ['pending','accepted','rejected'])->default('pending');
            $table->timestamps();

            $table->unique(['project_id','student_id']); // منع تكرار دعوة لنفس المشروع

            $table->foreign('project_id')->references('id')->on('projects')->onDelete('cascade');
            $table->foreign('student_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('sent_by_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_invitations');
    }
};
