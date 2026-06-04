<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $defaultName = env('DEFAULT_UNIVERSITY_NAME', 'Legacy');

        $university = DB::table('universities')->where('slug', 'legacy')->first();

        if ($university) {
            $universityId = $university->id;
        } else {
            $universityId = DB::table('universities')->insertGetId([
                'name' => $defaultName,
                'slug' => 'legacy',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        DB::table('users')->whereNull('university_id')->update(['university_id' => $universityId]);
        DB::table('projects')->whereNull('university_id')->update(['university_id' => $universityId]);

        if (Schema::hasColumn('tasks', 'university_id')) {
            DB::table('tasks')->whereNull('university_id')->update(['university_id' => $universityId]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $defaultName = env('DEFAULT_UNIVERSITY_NAME', 'Legacy');
        $university = DB::table('universities')->where('name', $defaultName)->first();
        
        if ($university) {
            DB::table('users')->where('university_id', $university->id)->update(['university_id' => null]);
            DB::table('projects')->where('university_id', $university->id)->update(['university_id' => null]);
            DB::table('tasks')->where('university_id', $university->id)->update(['university_id' => null]);
            
            DB::table('universities')->where('id', $university->id)->delete();
        }
    }
};
