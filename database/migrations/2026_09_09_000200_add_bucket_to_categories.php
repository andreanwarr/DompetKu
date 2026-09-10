<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->string('bucket', 20)->default('lifestyle')->after('type');
        });

        DB::table('categories')->where('type', 'income')->update(['bucket' => 'income']);
        DB::table('categories')->whereIn('name', ['Keluarga', 'Rumah Tangga', 'Makan & Minum', 'Transportasi', 'Pulsa & Data'])->update(['bucket' => 'essential']);
        DB::table('categories')->where('name', 'Tabungan')->update(['bucket' => 'saving']);
    }

    public function down(): void
    {
        Schema::table('categories', fn (Blueprint $table) => $table->dropColumn('bucket'));
    }
};
