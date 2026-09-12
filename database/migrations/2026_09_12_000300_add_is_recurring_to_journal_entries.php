<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('journal_entries', function (Blueprint $table) {
            $table->boolean('is_recurring')->default(true)->index();
        });
    }

    public function down(): void
       {
        Schema::table('journal_entries', function (Blueprint $table) {
            $table->dropIndex(['is_recurring']);
            $table->dropColumn('is_recurring');
        });
    }
};
