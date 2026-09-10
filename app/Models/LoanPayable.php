<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LoanPayable extends Model
{
    protected $fillable = ['user_id', 'journal_entry_id', 'counterparty', 'principal_minor', 'outstanding_minor', 'received_at', 'due_date', 'status', 'notes'];

    protected function casts(): array
    {
        return ['principal_minor' => 'integer', 'outstanding_minor' => 'integer', 'received_at' => 'date', 'due_date' => 'date'];
    }

    public function payments(): HasMany
    {
        return $this->hasMany(LoanPayment::class, 'loan_payable_id');
    }
}
