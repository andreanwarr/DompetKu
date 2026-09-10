<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class LocaleController extends Controller
{
    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'locale' => ['required', Rule::in(['id', 'en'])],
        ]);

        $request->user()->forceFill([
            'locale' => $validated['locale'],
        ])->save();

        return back();
    }
}
