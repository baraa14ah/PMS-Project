<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('supervisor_universities', function (Blueprint $table) {
            $table->boolean('accepting_supervision')->default(true)->after('status');
        });

        DB::table('supervisor_universities')
            ->where('status', 'active')
            ->update(['accepting_supervision' => true]);
    }

    public function down(): void
    {
        Schema::table('supervisor_universities', function (Blueprint $table) {
            $table->dropColumn('accepting_supervision');
        });
    }
};
