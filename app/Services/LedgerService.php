<?php

namespace App\Services;

use App\Models\Category;
use App\Models\FundSource;
use App\Models\JournalEntry;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class LedgerService
{
    public function postIncomeOrExpense(int $userId, array $data): JournalEntry
    {
        $source = FundSource::ownedBy($userId)->where('is_active', true)->findOrFail($data['fund_source_id']);
        $category = Category::ownedBy($userId)->where('type', $data['type'])->where('is_archived', false)->findOrFail($data['category_id']);
        $amount = (int) $data['amount_minor'];

        return DB::transaction(function () use ($userId, $data, $source, $category, $amount) {
            $entry = JournalEntry::create([
                'user_id' => $userId,
                'public_id' => (string) Str::uuid(),
                'type' => $data['type'],
                'status' => 'posted',
                'amount_minor' => $amount,
                'effective_date' => $data['effective_date'],
                'description' => $data['description'] ?? null,
                'counterparty' => $data['counterparty'] ?? null,
                'idempotency_key' => $data['idempotency_key'] ?? null,
            ]);

            if ($data['type'] === 'income') {
                $entry->lines()->create(['account_type' => 'fund_source', 'account_id' => $source->id, 'debit_minor' => $amount]);
                $entry->lines()->create(['account_type' => 'income', 'category_id' => $category->id, 'credit_minor' => $amount]);
            } else {
                $entry->lines()->create(['account_type' => 'expense', 'category_id' => $category->id, 'debit_minor' => $amount]);
                $entry->lines()->create(['account_type' => 'fund_source', 'account_id' => $source->id, 'credit_minor' => $amount]);
            }

            $this->assertBalanced($entry);

            return $entry->load('lines');
        });
    }

    public function transfer(int $userId, array $data): JournalEntry
    {
        if ((int) $data['from_fund_source_id'] === (int) $data['to_fund_source_id']) {
            throw ValidationException::withMessages(['to_fund_source_id' => __('Sumber tujuan harus berbeda.')]);
        }

        $from = FundSource::ownedBy($userId)->findOrFail($data['from_fund_source_id']);
        $to = FundSource::ownedBy($userId)->findOrFail($data['to_fund_source_id']);
        $amount = (int) $data['amount_minor'];

        return DB::transaction(function () use ($userId, $data, $from, $to, $amount) {
            $entry = JournalEntry::create([
                'user_id' => $userId,
                'public_id' => (string) Str::uuid(),
                'type' => 'transfer',
                'status' => 'posted',
                'amount_minor' => $amount,
                'effective_date' => $data['effective_date'],
                'description' => $data['description'] ?? null,
                'idempotency_key' => $data['idempotency_key'] ?? null,
            ]);
            $entry->lines()->create(['account_type' => 'fund_source', 'account_id' => $to->id, 'debit_minor' => $amount]);
            $entry->lines()->create(['account_type' => 'fund_source', 'account_id' => $from->id, 'credit_minor' => $amount]);
            $this->assertBalanced($entry);

            return $entry->load('lines');
        });
    }

    public function assertBalanced(JournalEntry $entry): void
    {
        $debit = (int) $entry->lines()->sum('debit_minor');
        $credit = (int) $entry->lines()->sum('credit_minor');

        if ($debit !== $credit || $debit <= 0) {
            throw new \LogicException("Journal entry {$entry->id} is not balanced.");
        }
    }

    /** Tulis ulang line journal untuk entry income/expense yang sudah ada (dipakai edit transaksi). */
    public function postLines(JournalEntry $entry, array $data): void
    {
        $source = FundSource::ownedBy($entry->user_id)->where('is_active', true)->findOrFail($data['fund_source_id']);
        $category = Category::ownedBy($entry->user_id)->where('type', $entry->type)->where('is_archived', false)->findOrFail($data['category_id']);
        $amount = (int) $entry->amount_minor;

        if ($entry->type === 'income') {
            $entry->lines()->create(['account_type' => 'fund_source', 'account_id' => $source->id, 'debit_minor' => $amount]);
            $entry->lines()->create(['account_type' => 'income', 'category_id' => $category->id, 'credit_minor' => $amount]);
        } else {
            $entry->lines()->create(['account_type' => 'expense', 'category_id' => $category->id, 'debit_minor' => $amount]);
            $entry->lines()->create(['account_type' => 'fund_source', 'account_id' => $source->id, 'credit_minor' => $amount]);
        }
    }
}
