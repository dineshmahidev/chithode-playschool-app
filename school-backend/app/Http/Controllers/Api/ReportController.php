<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Transaction;
use App\Models\Attendance;
use Illuminate\Http\Request;
use Carbon\Carbon;

class ReportController extends Controller
{
    public function index()
    {
        // 1. Student Enrollment
        $totalStudents = User::where('role', 'student')->count();

        // 2. Active Teachers
        $totalTeachers = User::where('role', 'teacher')->count();

        // 3. Total Revenue
        $totalRevenue = Transaction::sum('amount');

        // 4. Pending Fees (Placeholder logic - assuming a target fee per student)
        // Let's assume a target fee of 25000 per student for now
        $targetFeePerStudent = 25000;
        $totalTargetRevenue = $totalStudents * $targetFeePerStudent;
        $pendingFees = max(0, $totalTargetRevenue - $totalRevenue);

        // 5. Attendance Rate
        $today = Carbon::today()->toDateString();
        $totalAttendanceRecords = Attendance::where('date', $today)->count();
        if ($totalAttendanceRecords > 0) {
            $presentCount = Attendance::where('date', $today)->where('status', 'present')->count();
            $attendanceRate = round(($presentCount / $totalAttendanceRecords) * 100);
        } else {
            $attendanceRate = 0;
        }

        // 6. New Admissions (In the last 30 days)
        $newAdmissions = User::where('role', 'student')
            ->where('created_at', '>=', Carbon::now()->subDays(30))
            ->count();

        // 7. Recent Activity
        $recentTransactions = Transaction::latest()->take(5)->get()->map(function ($t) {
            return [
                'type' => 'payment',
                'title' => 'Fee Payment Received',
                'description' => $t->name . ' paid ₹' . number_format($t->amount),
                'time' => $t->created_at->diffForHumans(),
                'icon' => 'currency-inr',
                'color' => 'bg-green-500'
            ];
        });

        $recentStudents = User::where('role', 'student')->latest()->take(5)->get()->map(function ($s) {
            return [
                'type' => 'enrollment',
                'title' => 'New Student Enrolled',
                'description' => $s->name . ' - ' . ($s->category ?? 'General'),
                'time' => $s->created_at->diffForHumans(),
                'icon' => 'account-plus',
                'color' => 'bg-blue-500'
            ];
        });

        $recentActivity = $recentTransactions->concat($recentStudents)->sortByDesc(function ($item) {
            return $item['time'];
        })->values()->take(5);

        return response()->json([
            'overview' => [
                ['id' => '1', 'title' => 'Student Enrollment', 'value' => (string) $totalStudents, 'icon' => 'account-group', 'color' => 'bg-blue-500'],
                ['id' => '2', 'title' => 'Total Revenue', 'value' => '₹' . number_format($totalRevenue), 'icon' => 'currency-inr', 'color' => 'bg-green-500'],
                ['id' => '3', 'title' => 'Pending Fees', 'value' => '₹' . number_format($pendingFees), 'icon' => 'alert-circle', 'color' => 'bg-orange-500'],
                ['id' => '4', 'title' => 'Active Teachers', 'value' => (string) $totalTeachers, 'icon' => 'account-tie', 'color' => 'bg-purple-500'],
                ['id' => '5', 'title' => 'Attendance Rate', 'value' => $attendanceRate . '%', 'icon' => 'check-circle', 'color' => 'bg-teal-500'],
                ['id' => '6', 'title' => 'New Admissions', 'value' => (string) $newAdmissions, 'icon' => 'account-plus', 'color' => 'bg-pink-500'],
            ],
            'recentActivity' => $recentActivity
        ]);
    }
}
