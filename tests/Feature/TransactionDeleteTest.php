<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\FundSource;
use App\Models\Receivable;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TransactionDeleteTest extends TestCase
{
    use RefreshDatabase;

    public function test_deleting_receivable_transaction_removes_its_receivable_record(): void
    {
        $user = User::factory()->create();
        $source = FundSource::create(['user_id'=>$user->id,'name'=>'Cash','type'=>'cash','opening_balance_minor'=>0,'opening_date'=>'2026-01-01']);

        $this->actingAs($user)->post('/receivables', [
            'counterparty'=>'Budi','fund_source_id'=>$source->id,'principal_minor'=>250_000,'issued_at'=>'2026-10-21',
        ])->assertRedirect();
        $entry = \App\Models\JournalEntry::where('user_id', $user->id)->where('type', 'receivable_issue')->firstOrFail();

        $this->actingAs($user)->delete("/transactions/{$entry->public_id}")->assertRedirect()->assertSessionHasNoErrors();
        $this->assertDatabaseCount('receivables', 0);
        $this->assertDatabaseMissing('journal_entries', ['id'=>$entry->id]);
    }
}
