<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SavingGoal extends Model
{
    protected $fillable = ['user_id', 'name', 'target_minor', 'opening_balance_minor', 'target_date', 'color', 'status'];

    protected function casts(): array
    {
        return ['target_minor' => 'integer', 'opening_balance_minor' => 'integer', 'target_date' => 'date'];
    }
}
