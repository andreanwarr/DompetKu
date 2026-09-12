<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\FundSource;
use App\Models\JournalEntry;
use App\Services\LedgerService;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class TransactionController extends Controller
{
    public function index(Request $request): Response
    {
        $userId = (int) $request->user()->id;
        $entries = JournalEntry::ownedBy($userId)->with('lines')->where('status', 'posted')
            ->latest('effective_date')->latest('id')->paginate(20)->through(fn (JournalEntry $entry) => [
                'id' => $entry->public_id,
                'type' => $entry->type,
                'amount' => $entry->amount_minor,
                'date' => $entry->effective_date->toDateString(),
                'description' => $entry->description,
                'counterparty' => $entry->counterparty,
                'fund_source_id' => $entry->lines->firstWhere('account_type', 'fund_source')?->account_id,
                'category_id' => $entry->lines->firstWhere('account_type', $entry->type)?->category_id,
                'is_recurring' => (bool) $entry->is_recurring,
            ]);

        return Inertia::render('transactions/index', [
            'transactions' => $entries,
            'fundSources' => FundSource::ownedBy($userId)->where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'categories' => Category::ownedBy($userId)->where('is_archived', false)->orderBy('name')->get(['id', 'name', 'type']),
        ]);
    }

    public function store(Request $request, LedgerService $ledger): RedirectResponse
    {
        $data = $request->validate([
            'type' => ['required', Rule::in(['income', 'expense'])],
            'amount_minor' => ['required', 'integer', 'min:1'],
            'fund_source_id' => ['required', 'integer'],
            'category_id' => ['required', 'integer'],
            'effective_date' => ['required', 'date'],
            'description' => ['required', 'string', 'max:255'],
            'counterparty' => ['nullable', 'string', 'max:1000'],
            'idempotency_key' => ['nullable', 'uuid'],
            'is_recurring' => ['nullable', 'boolean'],
        ]);

        // idempotensi: key duplikat = request ulang, anggap sukses
        try {
            $ledger->postIncomeOrExpense((int) $request->user()->id, $data);
        } catch (UniqueConstraintViolationException) {
            return back()->with('success', __('Transaksi berhasil dicatat.'));
        }

        return back()->with('success', __('Transaksi berhasil dicatat.'));
    }

    public function update(Request $request, LedgerService $ledger, string $id): RedirectResponse
    {
        $entry = JournalEntry::ownedBy((int) $request->user()->id)->where('public_id', $id)->firstOrFail();
        $data = $request->validate([
            'type' => ['required', Rule::in(['income', 'expense'])],
            'amount_minor' => ['required', 'integer', 'min:1'],
            'fund_source_id' => ['required', 'integer'],
            'category_id' => ['required', 'integer'],
            'effective_date' => ['required', 'date'],
            'description' => ['required', 'string', 'max:255'],
            'counterparty' => ['nullable', 'string', 'max:1000'],
            'is_recurring' => ['nullable', 'boolean'],
        ]);

        // hapus line lama + repost dengan nilai baru dalam satu transaksi; key baru supaya tidak nabrak unique constraint
        DB::transaction(function () use ($entry, $data, $ledger) {
            $entry->lines()->delete();
            $entry->update([
                'type' => $data['type'], 'amount_minor' => $data['amount_minor'], 'effective_date' => $data['effective_date'],
                'description' => $data['description'], 'counterparty' => $data['counterparty'] ?? null,
                'idempotency_key' => (string) Str::uuid(),
                'is_recurring' => $data['is_recurring'] ?? true,
            ]);
            $ledger->postLines($entry, $data);
            $ledger->assertBalanced($entry);
        });

        return back()->with('success', __('Transaksi berhasil diubah.'));
    }

    public function transfer(Request $request, LedgerService $ledger): RedirectResponse
    {
        $data = $request->validate([
            'from_fund_source_id' => ['required', 'integer'],
            'to_fund_source_id' => ['required', 'integer'],
            'amount_minor' => ['required', 'integer', 'min:1'],
            'effective_date' => ['required', 'date'],
            'description' => ['nullable', 'string', 'max:1000'],
            'idempotency_key' => ['nullable', 'uuid'],
        ]);
        $ledger->transfer((int) $request->user()->id, $data);

        return back()->with('success', __('Transfer berhasil dicatat.'));
    }
}
