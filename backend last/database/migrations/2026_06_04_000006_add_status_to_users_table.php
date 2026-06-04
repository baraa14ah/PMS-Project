<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasColumn('users', 'status')) {
            Schema::table('users', function (Blueprint $blueprint) {
                // Add status column with default 'pending' for new registrations.
                // Using string for flexibility, but constrained by validation.
                $blueprint->string('status')->default('pending')->after('role_id');

                // Add composite index for admin queries
                $blueprint->index(['university_id', 'status']);
            });
        }

        // Backfill existing users to 'active'
        DB::table('users')->update(['status' => 'active']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $blueprint) {
            $blueprint->dropIndex(['university_id', 'status']);
            $blueprint->dropColumn('status');
        });
    }
};
