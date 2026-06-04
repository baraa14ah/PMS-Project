<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('student_number', 50)->nullable()->after('university_id');
            $table->unique(['university_id', 'student_number'], 'users_university_student_number_unique');
        });

        $profiles = DB::table('user_profiles')
            ->whereNotNull('student_number')
            ->where('student_number', '!=', '')
            ->get(['user_id', 'student_number']);

        foreach ($profiles as $profile) {
            DB::table('users')
                ->where('id', $profile->user_id)
                ->whereNull('student_number')
                ->update(['student_number' => $profile->student_number]);
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique('users_university_student_number_unique');
            $table->dropColumn('student_number');
        });
    }
};
