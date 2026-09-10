<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class FundSource extends Model
{
    protected $fillable = ['user_id', 'name', 'type', 'opening_balance_minor', 'opening_date', 'color', 'is_active'];

    protected function casts(): array
    {
        return ['opening_balance_minor' => 'integer', 'opening_date' => 'date', 'is_active' => 'boolean'];
    }

    public function scopeOwnedBy(Builder $query, int $userId): Builder
    {
        return $query->where('user_id', $userId);
    }
}
