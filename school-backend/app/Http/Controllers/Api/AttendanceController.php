<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Attendance;

class AttendanceController extends Controller
{
    public function index(Request $request)
    {
        $query = Attendance::query();
        if ($request->has('student_id')) {
            $query->where('student_id', $request->student_id);
        }
        if ($request->has('date')) {
            $query->where('date', $request->date);
        }
        return response()->json($query->latest()->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'student_id' => 'required|integer',
            'date' => 'required|date',
            'status' => 'required|in:present,absent,late',
            'in_time' => 'nullable|string',
            'out_time' => 'nullable|string',
            'dropped_by_type' => 'nullable|string',
            'picked_by_type' => 'nullable|string',
            'dropped_by_name' => 'nullable|string',
            'picked_by_name' => 'nullable|string',
        ]);

        $attendance = Attendance::updateOrCreate(
            ['student_id' => $request->student_id, 'date' => $request->date],
            $validated
        );
        return response()->json($attendance, 201);
    }
}
