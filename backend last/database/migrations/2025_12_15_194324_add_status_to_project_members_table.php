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
        Schema::table('project_members', function (Blueprint $table) {
            $table->enum('status', ['pending','accepted','rejected'])->default('accepted')->after('student_id');
        });
    }
    
    public function down()
    {
        Schema::table('project_members', function (Blueprint $table) {
            $table->dropColumn('status');
        });
    }
    
};
