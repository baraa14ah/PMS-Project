<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('supervisor_universities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('university_id')->constrained('universities')->cascadeOnDelete();
            $table->unique(['user_id', 'university_id']);
        });

        $supervisorRoleId = DB::table('roles')->where('name', 'supervisor')->value('id');
        if ($supervisorRoleId) {
            $supervisors = DB::table('users')
                ->where('role_id', $supervisorRoleId)
                ->whereNotNull('university_id')
                ->get(['id', 'university_id']);

            foreach ($supervisors as $user) {
                DB::table('supervisor_universities')->insertOrIgnore([
                    'user_id' => $user->id,
                    'university_id' => $user->university_id,
                ]);
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('supervisor_universities');
    }
};
