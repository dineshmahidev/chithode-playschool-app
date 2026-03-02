<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Attendance;
use App\Models\User;
use App\Services\ExpoNotificationService;

class AttendanceController extends Controller
{
    protected $notificationService;

    public function __construct(ExpoNotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }
    public function index(Request $request)
    {
        $query = Attendance::query();
        if ($request->has('student_id')) {
            $query->where('student_id', $request->student_id);
        }
        if ($request->has('user_role')) {
            $query->where('user_role', $request->user_role);
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
            'user_role' => 'nullable|string',
            'remarks' => 'nullable|string',
        ]);

        $attendance = Attendance::updateOrCreate(
            ['student_id' => $request->student_id, 'date' => $request->date],
            $validated
        );

        // Send push notification to the individual student/parent
        $statusLabel = ucfirst($attendance->status);
        $title = "Attendance Marked: " . $statusLabel;
        $body = "Attendance for " . $attendance->date . " has been marked as " . $statusLabel . ".";

        $this->notificationService->notifyUser($attendance->student_id, $title, $body);

        return response()->json($attendance, 201);
    }
}
