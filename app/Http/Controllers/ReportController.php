<?php

namespace App\Http\Controllers;

use App\Models\JournalEntry;
use App\Services\InsightService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    public function index(Request $request): Response
    {
        $userId = (int) $request->user()->id;
        $from = $request->date('from')?->toDateString() ?? now()->startOfYear()->toDateString();
        $to = $request->date('to')?->toDateString() ?? now()->toDateString();
        $entries = JournalEntry::ownedBy($userId)->where('status', 'posted')->whereIn('type', ['income', 'expense'])
            ->whereBetween('effective_date', [$from, $to])->orderBy('effective_date')->get();
        $income = (int) $entries->where('type', 'income')->sum('amount_minor');
        $expense = (int) $entries->where('type', 'expense')->sum('amount_minor');
        $monthly = $entries->groupBy(fn (JournalEntry $entry) => $entry->effective_date->format('Y-m'))
            ->map(fn ($items, string $month) => ['month' => $month, 'income' => (int) $items->where('type', 'income')->sum('amount_minor'), 'expense' => (int) $items->where('type', 'expense')->sum('amount_minor')])->values();
        $expenseByCategory = $this->categoryTotals($userId, 'expense', $from, $to);
        $incomeByCategory = $this->categoryTotals($userId, 'income', $from, $to);
        // saran otomatis via InsightService: basis bulan terakhir dalam rentang filter
        $insights = InsightService::build($userId, $monthly->last()['month'] ?? null);
        $categoryDetails = JournalEntry::ownedBy($userId)->with('lines')->where('status', 'posted')->where('type', 'expense')->whereBetween('effective_date', [$from, $to])->orderByDesc('effective_date')->orderByDesc('id')->get()->map(fn (JournalEntry $entry) => [
            'category_id' => $entry->lines->firstWhere('account_type', 'expense')?->category_id,
            'title' => $entry->description ?: ucfirst(str_replace('_', ' ', $entry->type)), 'amount' => $entry->amount_minor, 'date' => $entry->effective_date->toDateString(),
        ])->groupBy('category_id');
        return Inertia::render('reports/index', [
            'filters' => compact('from', 'to'),
            'summary' => compact('income', 'expense'),
            'monthly' => $monthly,
            'expenseByCategory' => $expenseByCategory,
            'incomeByCategory' => $incomeByCategory,
            'insights' => $insights,
            'categoryTransactions' => $categoryDetails,
        ]);
    }

    private function categoryTotals(int $userId, string $type, string $from, string $to)
    {
        $minor = $type === 'expense' ? 'debit' : 'credit';
        $fallback = $type === 'expense' ? 'Lainnya' : 'Pemasukan lain';
        // expense: semua debit ke kategori apapun tipe entry-nya (uang keluar beneran), income: semua credit
        $typeFilter = $type === 'expense'
            ? ["journal_lines.account_type = 'expense'", 'journal_entries.type', ['savings_deposit', 'savings_withdrawal', 'receivable_payment', 'loan_payment']]
            : ["journal_lines.account_type = 'income'", 'journal_entries.type', ['receivable_issue', 'loan_receipt']];
        return DB::table('journal_lines')->join('journal_entries', 'journal_entries.id', '=', 'journal_lines.journal_entry_id')->leftJoin('categories', 'categories.id', '=', 'journal_lines.category_id')
            ->where('journal_entries.user_id', $userId)->where('journal_entries.status', 'posted')->whereRaw($typeFilter[0])->whereNotIn($typeFilter[1], $typeFilter[2])->whereBetween('journal_entries.effective_date', [$from, $to])
            ->groupBy('categories.id', 'categories.name', 'categories.color')->selectRaw("COALESCE(categories.id, 0) AS id, COALESCE(categories.name, '{$fallback}') AS name, COALESCE(categories.color, '#64748b') AS color, SUM(journal_lines.{$minor}_minor) AS total")->orderByDesc('total')->get();
    }
}
