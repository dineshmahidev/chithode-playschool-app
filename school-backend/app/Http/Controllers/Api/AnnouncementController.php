<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Announcement;
use App\Services\ExpoNotificationService;

class AnnouncementController extends Controller
{
    protected $notificationService;

    public function __construct(ExpoNotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }
    public function index()
    {
        return response()->json(Announcement::latest()->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string',
            'content' => 'required|string',
            'image_url' => 'nullable|string',
            'date' => 'required|string',
            'target' => 'required|string',
            'author' => 'required|string',
        ]);

        // Accept 'image' as alias for 'image_url'
        if (!isset($validated['image_url']) && $request->has('image')) {
            $validated['image_url'] = $request->input('image');
        }

        $announcement = Announcement::create($validated);

        // Send push notification based on target
        $title = "New Announcement: " . $announcement->title;
        $body = $announcement->content;

        if ($announcement->target === 'all') {
            $this->notificationService->notifyAll($title, $body);
        } else {
            $this->notificationService->notifyRole($announcement->target, $title, $body);
        }

        return response()->json($announcement, 201);
    }

    public function destroy($id)
    {
        Announcement::destroy($id);
        return response()->json(['message' => 'Announcement deleted']);
    }
}
