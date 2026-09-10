<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReceivablePayment extends Model
{
    protected $fillable = ['receivable_id', 'journal_entry_id', 'principal_minor', 'interest_minor', 'penalty_minor', 'paid_at'];
}
