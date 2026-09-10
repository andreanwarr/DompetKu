<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Receivable extends Model
{
    protected $fillable = ['user_id', 'journal_entry_id', 'counterparty', 'principal_minor', 'outstanding_minor', 'issued_at', 'due_date', 'status', 'notes'];

    protected function casts(): array
    {
        return ['principal_minor' => 'integer', 'outstanding_minor' => 'integer', 'issued_at' => 'date', 'due_date' => 'date'];
    }

    public function payments(): HasMany
    {
        return $this->hasMany(ReceivablePayment::class);
    }
}
