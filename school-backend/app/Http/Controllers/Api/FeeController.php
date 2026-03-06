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
            'due_date' => 'nullable|string',
            'paid_at' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $fee = Fee::create($validated);

        if ($fee->status === 'paid') {
            $service = app(\App\Services\ExpoNotificationService::class);
            $title = "Fee Payment Successful! ✅";
            $body = "Payment of ₹" . number_format($fee->amount) . " for " . $fee->type . " received. You can now view and download your digital receipt.";

            // Notify student
            $service->notifyUser($fee->student_id, $title, $body, [
                'screen' => 'myFees',
                'id' => $fee->id
            ]);

            // Notify admins (all copies)
            $service->notifyRole('admin', "[ADMIN COPY] Fee Paid: " . $fee->student_name, $body, [
                'screen' => 'FeeManagement',
                'id' => $fee->id
            ]);
        }

        return response()->json($fee, 201);
    }

    public function update(Request $request, $id)
    {
        $fee = Fee::findOrFail($id);
        $oldStatus = $fee->status;
        $fee->update($request->all());

        // Send push notification if status changed to paid
        if ($fee->status === 'paid' && $oldStatus !== 'paid') {
            $service = app(\App\Services\ExpoNotificationService::class);
            $title = "Fee Payment Successful! ✅";
            $body = "Payment of ₹" . number_format($fee->amount) . " for " . $fee->type . " received. You can now view and download your digital receipt.";

            // Notify student
            $service->notifyUser($fee->student_id, $title, $body, [
                'screen' => 'myFees',
                'id' => $fee->id
            ]);

            // Notify admins (all copies)
            $service->notifyRole('admin', "[ADMIN COPY] Fee Paid: " . $fee->student_name, $body, [
                'screen' => 'FeeManagement',
                'id' => $fee->id
            ]);
        }

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
        if ($fee->status === 'paid') {
            $fee->status = 'unpaid';
            $fee->paid_at = null;
        } else {
            $fee->status = 'paid';
            $fee->paid_at = now()->format('Y-m-d H:i:s');
        }
        $fee->save();

        // Send push notification for payment confirmation
        if ($fee->status === 'paid') {
            $service = app(\App\Services\ExpoNotificationService::class);
            $title = "Fee Payment Successful! ✅";
            $body = "Payment of ₹" . number_format($fee->amount) . " for " . $fee->type . " received. You can now view and download your digital receipt.";

            // Notify student
            $service->notifyUser($fee->student_id, $title, $body, [
                'screen' => 'myFees',
                'id' => $fee->id
            ]);

            // Notify admins (all copies)
            $service->notifyRole('admin', "[ADMIN COPY] Fee Paid: " . $fee->student_name, $body, [
                'screen' => 'FeeManagement',
                'id' => $fee->id
            ]);
        }

        return response()->json($fee);
    }
}
