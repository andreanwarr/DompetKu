<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class JournalEntry extends Model
{
    protected $fillable = ['user_id', 'public_id', 'type', 'status', 'amount_minor', 'effective_date', 'description', 'counterparty', 'idempotency_key', 'reversed_entry_id'];

    protected function casts(): array
    {
        return ['amount_minor' => 'integer', 'effective_date' => 'date'];
    }

    public function lines(): HasMany
    {
        return $this->hasMany(JournalLine::class);
    }

    public function scopeOwnedBy(Builder $query, int $userId): Builder
    {
        return $query->where('user_id', $userId);
    }
}
