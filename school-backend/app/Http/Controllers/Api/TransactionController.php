<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Transaction;

class TransactionController extends Controller
{
    public function index(Request $request)
    {
        $query = Transaction::query();

        // Date range filter: ?from=2024-01-01&to=2024-01-31
        if ($request->has('from') && $request->has('to')) {
            $query->whereBetween('date', [$request->from, $request->to]);
        } elseif ($request->has('from')) {
            $query->where('date', '>=', $request->from);
        } elseif ($request->has('to')) {
            $query->where('date', '<=', $request->to);
        }

        // Type filter: ?type=income or ?type=expense
        if ($request->has('type') && in_array($request->type, ['income', 'expense'])) {
            $query->where('type', $request->type);
        }

        return response()->json($query->latest()->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'category' => 'required|string',
            'amount' => 'required|numeric',
            'type' => 'required|in:income,expense',
            'date' => 'required|string',
        ]);

        $transaction = Transaction::create($validated);
        return response()->json($transaction, 201);
    }

    public function update(Request $request, $id)
    {
        $transaction = Transaction::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string',
            'category' => 'sometimes|required|string',
            'amount' => 'sometimes|required|numeric',
            'type' => 'sometimes|required|in:income,expense',
            'date' => 'sometimes|required|string',
        ]);

        $transaction->update($validated);
        return response()->json($transaction);
    }

    public function destroy($id)
    {
        Transaction::destroy($id);
        return response()->json(['message' => 'Transaction deleted']);
    }
}
