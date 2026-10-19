<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\FundSource;
use App\Models\User;
use App\Services\LedgerService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class TransactionFilterTest extends TestCase
{
    use RefreshDatabase;

    public function test_transactions_default_to_current_month_and_accept_category_filter(): void
    {
        $user = User::factory()->create();
        $source = FundSource::create(['user_id'=>$user->id,'name'=>'Dompet','type'=>'cash','opening_balance_minor'=>0,'opening_date'=>'2026-09-01','color'=>'#000000','is_active'=>true]);
        $food = Category::create(['user_id'=>$user->id,'name'=>'Makan','type'=>'expense','color'=>'#000000','is_archived'=>false]);
        $other = Category::create(['user_id'=>$user->id,'name'=>'Lain','type'=>'expense','color'=>'#000000','is_archived'=>false]);
        $ledger = app(LedgerService::class);
        foreach ([['September', '2026-09-10', $food->id], ['August', '2026-08-10', $food->id], ['Other', '2026-09-11', $other->id]] as [$description,$date,$category]) {
            $ledger->postIncomeOrExpense($user->id, ['type'=>'expense','amount_minor'=>1000,'fund_source_id'=>$source->id,'category_id'=>$category,'effective_date'=>$date,'description'=>$description,'idempotency_key'=>fake()->uuid()]);
        }

        $this->travelTo(now()->setDate(2026, 9, 20));
        $this->actingAs($user)->get('/transactions?category='.$food->id)
            ->assertInertia(fn (Assert $page) => $page
                ->where('filters.month', '2026-09')
                ->where('transactions.total', 1)
                ->where('transactions.data.0.description', 'September'));
    }
}
