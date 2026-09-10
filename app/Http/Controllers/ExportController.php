<?php

namespace App\Http\Controllers;

use App\Models\FundSource;
use App\Models\JournalEntry;
use App\Models\LoanPayable;
use App\Models\Receivable;
use App\Models\SavingGoal;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ExportController extends Controller
{
    public function __invoke(Request $request): StreamedResponse
    {
        $userId = (int) $request->user()->id;
        $from = $request->date('from')?->toDateString() ?? now()->startOfYear()->toDateString();
        $to = $request->date('to')?->toDateString() ?? now()->toDateString();
        $entries = JournalEntry::ownedBy($userId)->where('status', 'posted')->whereBetween('effective_date', [$from, $to])
            ->orderBy('effective_date')->get();

        $income = (int) $entries->where('type', 'income')->sum('amount_minor');
        $expense = (int) $entries->where('type', 'expense')->sum('amount_minor');
        $net = $income - $expense;

        $book = new Spreadsheet;
        $summary = $book->getActiveSheet()->setTitle('Ringkasan');
        $summary->fromArray([
            ['DOMPETKU — LAPORAN KEUANGAN'],
            ['Periode', $from.' s/d '.$to],
            ['Diekspor', now($request->user()->timezone ?? 'Asia/Jakarta')->format('Y-m-d H:i')],
            [],
            ['Metrik', 'Nilai'],
            ['Pemasukan', $income],
            ['Pengeluaran', $expense],
            ['Arus Bersih', $net],
        ]);

        // ── Analisis sheet: flat key-value + category breakdown, AI-friendly ──
        $analisis = $book->createSheet()->setTitle('Analisis');
        $savingsRate = $income > 0 ? round($net / $income * 100, 1) : 0;
        $analisisRows = [
            ['## RINGKASAN CASHFLOW'],
            ['periode_dari', $from],
            ['periode_sampai', $to],
            ['pemasukan_total', $income],
            ['pengeluaran_total', $expense],
            ['arus_bersih', $net],
            ['rasio_tabungan_persen', $savingsRate],
            ['status', $net >= 0 ? 'surplus' : 'defisit'],
            [],
            ['## PENGELUARAN PER KATEGORI'],
            ['kategori', 'total', 'persen_dari_pengeluaran'],
        ];
        $expenseByCat = $this->categoryTotals($userId, 'expense', $from, $to);
        foreach ($expenseByCat as $cat) {
            $analisisRows[] = [$cat->name, (int) $cat->total, $expense > 0 ? round((int) $cat->total / $expense * 100, 1) : 0];
        }
        $analisisRows[] = [];
        $analisisRows[] = ['## PEMASUKAN PER KATEGORI'];
        $analisisRows[] = ['kategori', 'total', 'persen_dari_pemasukan'];
        $incomeByCat = $this->categoryTotals($userId, 'income', $from, $to);
        foreach ($incomeByCat as $cat) {
            $analisisRows[] = [$cat->name, (int) $cat->total, $income > 0 ? round((int) $cat->total / $income * 100, 1) : 0];
        }
        $analisisRows[] = [];
        $analisisRows[] = ['## SARAN OTOMATIS'];
        $analisisRows[] = ['prioritas', 'kategori', 'masalah', 'rekomendasi'];
        if ($net < 0) {
            $analisisRows[] = ['tinggi', '-', 'defisit', 'Pengeluaran melebihi pemasukan. Tinjau kategori dengan kontribusi tertinggi.'];
        }
        foreach ($expenseByCat as $cat) {
            $share = $expense > 0 ? round((int) $cat->total / $expense * 100, 1) : 0;
            if ($share >= 30) $analisisRows[] = ['sedang', $cat->name, "{$share}% dari pengeluaran", 'Tekan kategori ini ke bawah 30% dari total pengeluaran.'];
        }
        $analisis->fromArray($analisisRows);

        $transactions = $book->createSheet()->setTitle('Transaksi');
        $transactions->fromArray([['Tanggal', 'Tipe', 'Deskripsi', 'Pihak', 'Nominal']]);
        foreach ($entries as $index => $entry) {
            $transactions->fromArray([[$entry->effective_date->toDateString(), $entry->type, $entry->description, $entry->counterparty, $entry->amount_minor]], null, 'A'.($index + 2));
        }

        $sources = $book->createSheet()->setTitle('Sumber Dana');
        $sources->fromArray([['Nama', 'Tipe', 'Saldo Awal', 'Tanggal Saldo Awal', 'Aktif']]);
        foreach (FundSource::ownedBy($userId)->get() as $index => $source) {
            $sources->fromArray([[$source->name, $source->type, $source->opening_balance_minor, $source->opening_date->toDateString(), $source->is_active ? 'Ya' : 'Tidak']], null, 'A'.($index + 2));
        }

        $savings = $book->createSheet()->setTitle('Tabungan');
        $savings->fromArray([['Nama', 'Target', 'Saldo Awal', 'Target Tanggal', 'Status']]);
        foreach (SavingGoal::where('user_id', $userId)->get() as $index => $goal) {
            $savings->fromArray([[$goal->name, $goal->target_minor, $goal->opening_balance_minor, $goal->target_date?->toDateString(), $goal->status]], null, 'A'.($index + 2));
        }

        $receivables = $book->createSheet()->setTitle('Piutang Kasbon');
        $receivables->fromArray([['Pihak', 'Pokok', 'Sisa', 'Tanggal', 'Jatuh Tempo', 'Status']]);
        foreach (Receivable::where('user_id', $userId)->get() as $index => $item) {
            $receivables->fromArray([[$item->counterparty, $item->principal_minor, $item->outstanding_minor, $item->issued_at->toDateString(), $item->due_date?->toDateString(), $item->status]], null, 'A'.($index + 2));
        }

        $loans = $book->createSheet()->setTitle('Utang');
        $loans->fromArray([['Pihak', 'Pokok', 'Sisa', 'Tanggal', 'Jatuh Tempo', 'Status']]);
        foreach (LoanPayable::where('user_id', $userId)->get() as $index => $item) {
            $loans->fromArray([[$item->counterparty, $item->principal_minor, $item->outstanding_minor, $item->received_at->toDateString(), $item->due_date?->toDateString(), $item->status]], null, 'A'.($index + 2));
        }

        foreach ($book->getWorksheetIterator() as $sheet) {
            $lastColumn = $sheet->getHighestColumn();
            $sheet->getStyle("A1:{$lastColumn}1")->getFont()->setBold(true)->getColor()->setARGB('FFFFFFFF');
            $sheet->getStyle("A1:{$lastColumn}1")->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FF0F766E');
            foreach (range('A', $lastColumn) as $column) {
                $sheet->getColumnDimension($column)->setAutoSize(true);
            }
        }

        $filename = "dompetku-{$from}-{$to}.xlsx";

        return response()->streamDownload(function () use ($book) {
            (new Xlsx($book))->save('php://output');
            $book->disconnectWorksheets();
        }, $filename, ['Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']);
    }

    private function categoryTotals(int $userId, string $type, string $from, string $to)
    {
        $minor = $type === 'expense' ? 'debit' : 'credit';
        $fallback = $type === 'expense' ? 'Lainnya' : 'Pemasukan lain';
        return DB::table('journal_lines')->join('journal_entries', 'journal_entries.id', '=', 'journal_lines.journal_entry_id')->leftJoin('categories', 'categories.id', '=', 'journal_lines.category_id')
            ->where('journal_entries.user_id', $userId)->where('journal_entries.status', 'posted')->where('journal_entries.type', $type)->where('journal_lines.account_type', $type)->whereBetween('journal_entries.effective_date', [$from, $to])
            ->groupBy('categories.id', 'categories.name', 'categories.color')->selectRaw("COALESCE(categories.id, 0) AS id, COALESCE(categories.name, '{$fallback}') AS name, COALESCE(categories.color, '#64748b') AS color, SUM(journal_lines.{$minor}_minor) AS total")->orderByDesc('total')->get();
    }
}
