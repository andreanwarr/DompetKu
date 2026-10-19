<?php

namespace Tests\Feature;

use App\Models\FundSource;
use App\Models\JournalEntry;
use App\Models\SavingGoal;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ExternalSavingsTest extends TestCase
{
    use RefreshDatabase;

    public function test_external_savings_do_not_reduce_period_balance(): void
    {
        CarbonImmutable::setTestNow('2026-10-17 12:00:00');
        $user = User::factory()->create();
        $goal = SavingGoal::create(['user_id'=>$user->id,'name'=>'Tabungan','target_minor'=>10_000_000,'opening_balance_minor'=>0,'status'=>'active']);
        $source = FundSource::create(['user_id'=>$user->id,'name'=>'Dompet','type'=>'cash','opening_balance_minor'=>0,'opening_date'=>'2026-01-01','is_active'=>true]);

        $this->actingAs($user)->post("/savings/{$goal->id}/movements", [
            'direction'=>'deposit','external'=>true,'counterparty'=>'Suami','amount_minor'=>1_000_000,
            'effective_date'=>'2026-10-17','description'=>'Tabungan',
        ])->assertRedirect()->assertSessionHasNoErrors();

        $this->assertSame(1, JournalEntry::where('type','savings_deposit')->count());
        $this->assertSame(0, (int) JournalLine_sum_check());

        $this->actingAs($user)->get('/dashboard')->assertInertia(fn (Assert $page) => $page
            ->where('summary.savingDeposits', 0)
            ->where('summary.availableBalance', 0)
            ->where('summary.periodBalance', 0));

        CarbonImmutable::setTestNow();
    }
}

function JournalLine_sum_check(): int
{
    return \App\Models\JournalLine::where('account_type','fund_source')->sum('debit_minor') -
        \App\Models\JournalLine::where('account_type','fund_source')->sum('credit_minor');
}
