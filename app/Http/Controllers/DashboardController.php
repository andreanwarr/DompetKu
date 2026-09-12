<?php

namespace App\Http\Controllers;

use App\Models\FundSource;
use App\Models\JournalEntry;
use App\Models\JournalLine;
use App\Models\LoanPayable;
use App\Models\Receivable;
use App\Models\SavingGoal;
use App\Services\InsightService;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $userId = (int) $request->user()->id;
        $period = in_array($request->string('period')->value(), ['current', 'previous', 'three_months'], true)
            ? $request->string('period')->value()
            : 'current';
        $today = CarbonImmutable::today($request->user()->timezone ?? 'Asia/Jakarta');
        [$start, $end] = match ($period) {
            'previous' => [$today->subMonthNoOverflow()->startOfMonth(), $today->subMonthNoOverflow()->endOfMonth()],
            'three_months' => [$today->subMonthsNoOverflow(2)->startOfMonth(), $today],
            default => [$today->startOfMonth(), $today],
        };

        $sources = FundSource::ownedBy($userId)->orderBy('name')->get();
        $sourceIds = $sources->pluck('id');
        $mutations = JournalLine::query()
            ->select('account_id', DB::raw('SUM(debit_minor - credit_minor) AS movement'))
            ->where('account_type', 'fund_source')
            ->whereIn('account_id', $sourceIds)
            ->whereHas('entry', fn ($query) => $query->ownedBy($userId)->where('status', 'posted')->whereDate('effective_date', '<=', $today))
            ->groupBy('account_id')
            ->pluck('movement', 'account_id');

        $sourceBalances = $sources->map(fn (FundSource $source) => [
            'id' => $source->id,
            'name' => $source->name,
            'type' => $source->type,
            'color' => $source->color,
            'balance' => ($source->opening_date->lte($today) ? $source->opening_balance_minor : 0) + (int) ($mutations[$source->id] ?? 0),
        ]);
        $available = (int) $sourceBalances->sum('balance');

        $periodEntries = JournalEntry::ownedBy($userId)
            ->where('status', 'posted')
            ->whereBetween('effective_date', [$start->toDateString(), $end->toDateString()]);
        $income = (clone $periodEntries)->where('type', 'income')->sum('amount_minor');
        $recurringIncome = (clone $periodEntries)->where('type', 'income')->where('is_recurring', true)->sum('amount_minor');
        $expense = (clone $periodEntries)->where('type', 'expense')->sum('amount_minor');
        // setoran tabungan bulan ini: uang keluar dari kas, tapi bukan konsumsi — dipisah biar dua sudut pandang sama-sama jujur
        $savingDeposits = (clone $periodEntries)->where('type', 'savings_deposit')->sum('amount_minor');
        $savingWithdrawals = (clone $periodEntries)->where('type', 'savings_withdrawal')->sum('amount_minor');

        $savingGoals = SavingGoal::where('user_id', $userId)->where('status', 'active')->get();
        $savingIds = $savingGoals->pluck('id');
        $savingMutations = JournalLine::query()
            ->select('account_id', DB::raw('SUM(debit_minor - credit_minor) AS movement'))
            ->where('account_type', 'saving')
            ->whereIn('account_id', $savingIds)
            ->whereHas('entry', fn ($query) => $query->ownedBy($userId)->where('status', 'posted')->whereDate('effective_date', '<=', $today))
            ->groupBy('account_id')->pluck('movement', 'account_id');
        $savings = (int) $savingGoals->sum(fn (SavingGoal $goal) => $goal->opening_balance_minor + (int) ($savingMutations[$goal->id] ?? 0));
        $receivables = (int) Receivable::where('user_id', $userId)->whereIn('status', ['active', 'partial', 'overdue'])->sum('outstanding_minor');
        $loans = (int) LoanPayable::where('user_id', $userId)->whereIn('status', ['active', 'partial', 'overdue'])->sum('outstanding_minor');

        $expenseByCategory = DB::table('journal_lines')
            ->join('journal_entries', 'journal_entries.id', '=', 'journal_lines.journal_entry_id')
            ->leftJoin('categories', 'categories.id', '=', 'journal_lines.category_id')
            ->where('journal_entries.user_id', $userId)
            ->where('journal_entries.status', 'posted')
            ->where('journal_lines.account_type', 'expense')
            ->whereBetween('journal_entries.effective_date', [$start->toDateString(), $end->toDateString()])
            ->groupBy('categories.id', 'categories.name', 'categories.color')
            ->selectRaw("COALESCE(categories.id, 0) AS id, COALESCE(categories.name, 'Lainnya') AS name, COALESCE(categories.color, '#64748b') AS color, SUM(journal_lines.debit_minor) AS total")
            ->orderByDesc('total')->limit(6)->get();

        $categoryDetails = JournalEntry::ownedBy($userId)->with('lines')->where('status', 'posted')
            ->where('type', 'expense')
            ->whereBetween('effective_date', [$start->toDateString(), $end->toDateString()])
            ->orderByDesc('effective_date')->orderByDesc('id')->get()
            ->map(fn (JournalEntry $entry) => [
                'category_id' => $entry->lines->firstWhere('account_type', 'expense')?->category_id,
                'title' => $entry->description ?: ucfirst(str_replace('_', ' ', $entry->type)),
                'amount' => $entry->amount_minor,
                'date' => $entry->effective_date->toDateString(),
            ])
            ->groupBy('category_id');

        $recent = JournalEntry::ownedBy($userId)->with('lines')->where('status', 'posted')
            ->latest('effective_date')->latest('id')->limit(8)->get()->map(fn (JournalEntry $entry) => [
                'id' => $entry->public_id,
                'type' => $entry->type,
                'amount' => $entry->amount_minor,
                'date' => $entry->effective_date->toDateString(),
                'description' => $entry->description ?: $entry->counterparty ?: ucfirst(str_replace('_', ' ', $entry->type)),
            ]);

        return Inertia::render('dashboard', [
            'period' => $period,
            'range' => ['start' => $start->toDateString(), 'end' => $end->toDateString()],
            'summary' => [
                'netWorth' => $available + $receivables,
                // saldo bulan ini = gaji rutin - konsumsi - setor tabungan; bonus tidak masuk anggaran bulanan
                'periodBalance' => (int) $recurringIncome - (int) $expense - (int) $savingDeposits + (int) $savingWithdrawals,
                'availableBalance' => $available,
                'income' => (int) $income,
                'recurringIncome' => (int) $recurringIncome,
                'bonusIncome' => (int) $income - (int) $recurringIncome,
                'expense' => (int) $expense,
                'savingDeposits' => (int) $savingDeposits,
                'savingWithdrawals' => (int) $savingWithdrawals,
                'savings' => $savings,
                'receivables' => $receivables,
                'loans' => $loans,
            ],
            'sourceBalances' => $sourceBalances,
            'expenseByCategory' => $expenseByCategory,
            'categoryTransactions' => $categoryDetails,
            'insights' => InsightService::build($userId, $end->format('Y-m'), $savings),
            'recentTransactions' => $recent,
        ]);
    }
}
