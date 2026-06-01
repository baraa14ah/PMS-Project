<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('supervisor_invitations', function (Blueprint $table) {
            if (!Schema::hasColumn('supervisor_invitations', 'sent_by_id')) {
                $table->foreignId('sent_by_id')
                    ->nullable()
                    ->after('student_id')
                    ->constrained('users')
                    ->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('supervisor_invitations', function (Blueprint $table) {
            if (Schema::hasColumn('supervisor_invitations', 'sent_by_id')) {
                $table->dropConstrainedForeignId('sent_by_id');
            }
        });
    }
};
