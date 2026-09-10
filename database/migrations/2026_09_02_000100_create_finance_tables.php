<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('locale', 5)->default('id');
            $table->string('timezone', 64)->default('Asia/Jakarta');
            $table->string('currency', 3)->default('IDR');
        });

        Schema::create('fund_sources', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('type', 32);
            $table->bigInteger('opening_balance_minor')->default(0);
            $table->date('opening_date');
            $table->string('color', 16)->default('#0f766e');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->index(['user_id', 'is_active']);
        });

        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type', 16);
            $table->string('name');
            $table->string('icon', 48)->nullable();
            $table->string('color', 16)->default('#64748b');
            $table->boolean('is_archived')->default(false);
            $table->timestamps();
            $table->unique(['user_id', 'type', 'name']);
        });

        Schema::create('journal_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->uuid('public_id')->unique();
            $table->string('type', 32);
            $table->string('status', 16)->default('posted');
            $table->bigInteger('amount_minor');
            $table->date('effective_date');
            $table->text('description')->nullable();
            $table->string('counterparty')->nullable();
            $table->uuid('idempotency_key')->nullable();
            $table->foreignId('reversed_entry_id')->nullable()->constrained('journal_entries')->nullOnDelete();
            $table->timestamps();
            $table->unique(['user_id', 'idempotency_key']);
            $table->index(['user_id', 'effective_date']);
            $table->index(['user_id', 'type', 'status']);
        });

        Schema::create('journal_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('journal_entry_id')->constrained()->cascadeOnDelete();
            $table->string('account_type', 32);
            $table->unsignedBigInteger('account_id')->nullable();
            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();
            $table->bigInteger('debit_minor')->default(0);
            $table->bigInteger('credit_minor')->default(0);
            $table->timestamps();
            $table->index(['account_type', 'account_id']);
        });

        Schema::create('saving_goals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->bigInteger('target_minor');
            $table->bigInteger('opening_balance_minor')->default(0);
            $table->date('target_date')->nullable();
            $table->string('color', 16)->default('#7c3aed');
            $table->string('status', 16)->default('active');
            $table->timestamps();
        });

        Schema::create('receivables', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('journal_entry_id')->constrained()->restrictOnDelete();
            $table->string('counterparty');
            $table->bigInteger('principal_minor');
            $table->bigInteger('outstanding_minor');
            $table->date('issued_at');
            $table->date('due_date')->nullable();
            $table->string('status', 24)->default('active');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'status', 'due_date']);
        });

        Schema::create('receivable_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('receivable_id')->constrained()->cascadeOnDelete();
            $table->foreignId('journal_entry_id')->constrained()->restrictOnDelete();
            $table->bigInteger('principal_minor');
            $table->bigInteger('interest_minor')->default(0);
            $table->bigInteger('penalty_minor')->default(0);
            $table->date('paid_at');
            $table->timestamps();
        });

        Schema::create('loan_payables', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('journal_entry_id')->constrained()->restrictOnDelete();
            $table->string('counterparty');
            $table->bigInteger('principal_minor');
            $table->bigInteger('outstanding_minor');
            $table->date('received_at');
            $table->date('due_date')->nullable();
            $table->string('status', 24)->default('active');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'status', 'due_date']);
        });

        Schema::create('loan_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('loan_payable_id')->constrained()->cascadeOnDelete();
            $table->foreignId('journal_entry_id')->constrained()->restrictOnDelete();
            $table->bigInteger('principal_minor');
            $table->bigInteger('interest_minor')->default(0);
            $table->bigInteger('penalty_minor')->default(0);
            $table->date('paid_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loan_payments');
        Schema::dropIfExists('loan_payables');
        Schema::dropIfExists('receivable_payments');
        Schema::dropIfExists('receivables');
        Schema::dropIfExists('saving_goals');
        Schema::dropIfExists('journal_lines');
        Schema::dropIfExists('journal_entries');
        Schema::dropIfExists('categories');
        Schema::dropIfExists('fund_sources');

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['locale', 'timezone', 'currency']);
        });
    }
};
