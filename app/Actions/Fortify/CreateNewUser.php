<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Models\Category;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules, ProfileValidationRules;

    /**
     * Validate and create a newly registered user.
     *
     * @param  array<string, string>  $input
     */
    public function create(array $input): User
    {
        Validator::make($input, [
            ...$this->profileRules(),
            'password' => $this->passwordRules(),
        ])->validate();

        return DB::transaction(function () use ($input) {
            $user = User::create([
                'name' => $input['name'],
                'email' => $input['email'],
                'password' => $input['password'],
            ]);

            $defaults = [
                'income' => ['Gaji', 'Bonus', 'Penjualan', 'Bunga', 'Lainnya'],
                'expense' => ['Makanan', 'Transportasi', 'Tagihan', 'Belanja', 'Kesehatan', 'Pendidikan', 'Hiburan', 'Lainnya'],
            ];
            foreach ($defaults as $type => $names) {
                foreach ($names as $name) {
                    Category::create(['user_id' => $user->id, 'type' => $type, 'name' => $name]);
                }
            }

            return $user;
        });
    }
}
