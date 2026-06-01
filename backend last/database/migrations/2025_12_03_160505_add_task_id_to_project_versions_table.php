<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
public function up(): void
{
    Schema::table('project_versions', function (Blueprint $table) {
        $table->foreignId('task_id')->nullable()->constrained('tasks')->onDelete('set null');
    });
}

public function down(): void
{
    Schema::table('project_versions', function (Blueprint $table) {
        // أولاً احذف الـ FK
        if (Schema::hasColumn('project_versions', 'task_id')) {
            $table->dropConstrainedForeignId('task_id'); // هذا يحذف FK + العمود بطريقة صحيحة
        }
    });
}


};
