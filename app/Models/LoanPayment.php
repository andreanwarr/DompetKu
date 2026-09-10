<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LoanPayment extends Model
{
    protected $fillable = ['loan_payable_id', 'journal_entry_id', 'principal_minor', 'interest_minor', 'penalty_minor', 'paid_at'];
}
