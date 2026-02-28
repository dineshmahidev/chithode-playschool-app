<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Fee;

class FeeController extends Controller
{
    public function index(Request $request)
    {
        $query = Fee::query();

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('student_name', 'like', "%$search%")
                    ->orWhere('student_id', 'like', "%$search%");
            });
        }

        return response()->json($query->latest()->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'student_id' => 'required|string',
            'student_name' => 'required|string',
            'type' => 'required|string',
            'amount' => 'required|numeric',
            'status' => 'required|string',
            'date' => 'required|string',
            'notes' => 'nullable|string',
        ]);

        $fee = Fee::create($validated);
        return response()->json($fee, 201);
    }

    public function update(Request $request, $id)
    {
        $fee = Fee::findOrFail($id);
        $fee->update($request->all());
        return response()->json($fee);
    }

    public function destroy($id)
    {
        Fee::destroy($id);
        return response()->json(['message' => 'Fee record deleted']);
    }

    public function toggleStatus($id)
    {
        $fee = Fee::findOrFail($id);
        $fee->status = $fee->status === 'paid' ? 'unpaid' : 'paid';
        $fee->save();
        return response()->json($fee);
    }
}
