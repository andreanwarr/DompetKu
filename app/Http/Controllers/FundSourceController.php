<?php

namespace App\Http\Controllers;

use App\Models\FundSource;
use App\Models\JournalLine;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class FundSourceController extends Controller
{
    public function index(Request $request): Response
    {
        $userId = (int) $request->user()->id;
        $today = CarbonImmutable::today($request->user()->timezone ?? 'Asia/Jakarta');
        $sources = FundSource::ownedBy($userId)->orderBy('name')->get();
        $movements = JournalLine::query()
            ->select('account_id', DB::raw('SUM(debit_minor - credit_minor) AS movement'))
            ->where('account_type', 'fund_source')
            ->whereIn('account_id', $sources->pluck('id'))
            ->whereHas('entry', fn ($query) => $query->ownedBy($userId)->where('status', 'posted')->whereDate('effective_date', '<=', $today))
            ->groupBy('account_id')
            ->pluck('movement', 'account_id');

        return Inertia::render('fund-sources/index', [
            'fundSources' => $sources->map(fn (FundSource $source) => [
                ...$source->toArray(),
                'current_balance_minor' => ($source->opening_date->lte($today) ? $source->opening_balance_minor : 0)
                    + (int) ($movements[$source->id] ?? 0),
            ]),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'type' => ['required', Rule::in(['cash', 'bank', 'ewallet', 'prepaid', 'other'])],
            'opening_balance_minor' => ['required', 'integer', 'min:0'],
            'opening_date' => ['required', 'date'],
            'color' => ['nullable', 'regex:/^#[0-9a-fA-F]{6}$/'],
        ]);
        $request->user()->fundSources()->create($data);

        return back()->with('success', __('Sumber dana berhasil ditambahkan.'));
    }
}
