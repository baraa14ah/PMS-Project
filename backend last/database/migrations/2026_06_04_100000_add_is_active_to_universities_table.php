<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('universities', 'is_active')) {
            Schema::table('universities', function (Blueprint $table) {
                $table->boolean('is_active')->default(true)->after('slug');
            });
        }

        DB::table('universities')->whereNull('is_active')->update(['is_active' => true]);
    }

    public function down(): void
    {
        Schema::table('universities', function (Blueprint $table) {
            $table->dropColumn('is_active');
        });
    }
};
