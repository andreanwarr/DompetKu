<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\FundSource;
use App\Models\User;
use App\Services\LedgerService;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        // Data demo sepenuhnya fiktif. Jangan pernah menaruh data pribadi di sini.
        $user = User::updateOrCreate(
            ['email' => 'demo@dompetku.test'],
            ['name' => 'Demo Pengguna', 'password' => 'password', 'email_verified_at' => now()],
        );

        foreach ([['Gajian', 'income', '#059669']] as [$name, $type, $color]) {
            Category::create(compact('name', 'type', 'color') + ['user_id' => $user->id]);
        }
        foreach ([
            ['Keluarga', '#f97316'], ['Tabungan', '#7c3aed'], ['Pulsa & Data', '#0ea5e9'],
            ['Makan & Minum', '#ef4444'], ['Transportasi', '#eab308'], ['Rumah Tangga', '#14b8a6'],
            ['Olahraga', '#22c55e'], ['Belanja', '#ec4899'],
        ] as [$name, $color]) {
            Category::create(['user_id' => $user->id, 'type' => 'expense', 'name' => $name, 'color' => $color]);
        }

        $wallet = FundSource::create([
            'user_id' => $user->id, 'name' => 'Dompet Utama', 'type' => 'cash',
            'opening_balance_minor' => 1000000, 'opening_date' => now()->startOfMonth(), 'color' => '#0f766e',
        ]);
        \App\Models\SavingGoal::create([
            'user_id' => $user->id, 'name' => 'Dana Darurat', 'target_minor' => 10000000,
            'opening_balance_minor' => 2500000, 'target_date' => null, 'color' => '#0ea5e9', 'status' => 'active',
        ]);
        $ledger = app(LedgerService::class);
        $cat = fn (string $name, string $type = 'expense') => Category::where('user_id', $user->id)->where('name', $name)->where('type', $type)->firstOrFail()->id;
        $post = fn (string $type, int $amount, int $category, string $description, int $day) => $ledger->postIncomeOrExpense($user->id, [
            'type' => $type, 'amount_minor' => $amount, 'fund_source_id' => $wallet->id,
            'category_id' => $category, 'effective_date' => now()->startOfMonth()->addDays($day)->toDateString(),
            'description' => $description,
        ]);

        $post('income', 5000000, $cat('Gajian', 'income'), 'Gaji bulanan', 1);
        $expenses = [
            ['Belanja bulanan', 150000, 'Belanja'], ['Makan siang', 25000, 'Makan & Minum'], ['Kopi', 18000, 'Makan & Minum'],
            ['Bensin', 50000, 'Transportasi'], ['Listrik', 200000, 'Rumah Tangga'], ['Internet', 300000, 'Pulsa & Data'],
            ['Nabung', 500000, 'Tabungan'], ['Keluarga', 750000, 'Keluarga'], ['Olahraga', 30000, 'Olahraga'],
            ['Makan malam', 45000, 'Makan & Minum'], ['Pulsa', 50000, 'Pulsa & Data'], ['Laundry', 20000, 'Rumah Tangga'],
        ];
        foreach ($expenses as $index => [$description, $amount, $category]) {
            $post('expense', $amount, $cat($category), $description, $index % 5);
        }
    }
}
