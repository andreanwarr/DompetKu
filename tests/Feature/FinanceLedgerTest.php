<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\FundSource;
use App\Models\JournalLine;
use App\Models\Receivable;
use App\Models\User;
use App\Services\LedgerService;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class FinanceLedgerTest extends TestCase
{
    use RefreshDatabase;

    public function test_income_creates_balanced_entry_and_increases_fund_balance(): void
    {
        [$user, $source, $income] = $this->fixtures();
        $entry = app(LedgerService::class)->postIncomeOrExpense($user->id, [
            'type' => 'income', 'amount_minor' => 1_000_000, 'fund_source_id' => $source->id,
            'category_id' => $income->id, 'effective_date' => '2026-09-01',
        ]);

        $this->assertSame(1_000_000, (int) $entry->lines->sum('debit_minor'));
        $this->assertSame(1_000_000, (int) $entry->lines->sum('credit_minor'));
        $this->assertSame(1_000_000, (int) JournalLine::where('account_type', 'fund_source')->sum('debit_minor'));
    }

    public function test_transfer_is_balanced_and_does_not_create_income_or_expense(): void
    {
        [$user, $source] = $this->fixtures();
        $target = FundSource::create(['user_id' => $user->id, 'name' => 'Cash', 'type' => 'cash', 'opening_balance_minor' => 0, 'opening_date' => '2026-01-01']);
        $entry = app(LedgerService::class)->transfer($user->id, [
            'from_fund_source_id' => $source->id, 'to_fund_source_id' => $target->id,
            'amount_minor' => 250_000, 'effective_date' => '2026-09-01',
        ]);

        $this->assertSame('transfer', $entry->type);
        $this->assertSame(250_000, (int) $entry->lines->sum('debit_minor'));
        $this->assertSame(250_000, (int) $entry->lines->sum('credit_minor'));
        $this->assertFalse($entry->lines->contains(fn ($line) => in_array($line->account_type, ['income', 'expense'], true)));
    }

    public function test_user_cannot_post_to_another_users_fund_source(): void
    {
        [$user, , $income] = $this->fixtures();
        $other = User::factory()->create();
        $foreignSource = FundSource::create(['user_id' => $other->id, 'name' => 'Foreign', 'type' => 'bank', 'opening_balance_minor' => 0, 'opening_date' => '2026-01-01']);

        $this->expectException(ModelNotFoundException::class);
        app(LedgerService::class)->postIncomeOrExpense($user->id, [
            'type' => 'income', 'amount_minor' => 100, 'fund_source_id' => $foreignSource->id,
            'category_id' => $income->id, 'effective_date' => '2026-09-01',
        ]);
    }

    public function test_receivable_reduces_cash_and_payment_restores_it(): void
    {
        [$user, $source] = $this->fixtures();

        $this->actingAs($user)->post('/receivables', [
            'counterparty' => 'Budi',
            'fund_source_id' => $source->id,
            'principal_minor' => 300_000,
            'issued_at' => '2026-09-01',
        ])->assertRedirect();

        $receivable = Receivable::firstOrFail();
        $this->assertSame(300_000, $receivable->outstanding_minor);
        $this->assertSame(-300_000, $this->fundMovement($source->id));

        $this->actingAs($user)->post("/receivables/{$receivable->id}/payments", [
            'fund_source_id' => $source->id,
            'principal_minor' => 125_000,
            'interest_minor' => 0,
            'penalty_minor' => 0,
            'paid_at' => '2026-09-02',
        ])->assertRedirect();

        $this->assertSame(175_000, $receivable->refresh()->outstanding_minor);
        $this->assertSame(-175_000, $this->fundMovement($source->id));
    }

    public function test_previous_period_filter_keeps_current_balance_current(): void
    {
        CarbonImmutable::setTestNow('2026-09-03 12:00:00');
        [$user, $source, $income] = $this->fixtures();
        app(LedgerService::class)->postIncomeOrExpense($user->id, [
            'type' => 'income',
            'amount_minor' => 500_000,
            'fund_source_id' => $source->id,
            'category_id' => $income->id,
            'effective_date' => '2026-09-03',
        ]);

        $this->actingAs($user)->get('/dashboard?period=previous')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('period', 'previous')
                ->where('summary.availableBalance', 500_000)
                ->where('summary.periodBalance', 0));

        CarbonImmutable::setTestNow();
    }

    public function test_user_can_switch_supported_locale(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->patch('/locale', ['locale' => 'en'])->assertRedirect();
        $this->assertSame('en', $user->refresh()->locale);

        $this->actingAs($user)->patch('/locale', ['locale' => 'fr'])
            ->assertSessionHasErrors('locale');
        $this->assertSame('en', $user->refresh()->locale);
    }

    private function fundMovement(int $sourceId): int
    {
        return (int) JournalLine::where('account_type', 'fund_source')
            ->where('account_id', $sourceId)
            ->selectRaw('COALESCE(SUM(debit_minor - credit_minor), 0) AS movement')
            ->value('movement');
    }

    private function fixtures(): array
    {
        $user = User::factory()->create();
        $source = FundSource::create(['user_id' => $user->id, 'name' => 'Bank', 'type' => 'bank', 'opening_balance_minor' => 0, 'opening_date' => '2026-01-01']);
        $income = Category::create(['user_id' => $user->id, 'type' => 'income', 'name' => 'Gaji']);

        return [$user, $source, $income];
    }
}
