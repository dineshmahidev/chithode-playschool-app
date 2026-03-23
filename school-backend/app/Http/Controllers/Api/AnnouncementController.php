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

        // Save physical file if image is base64
        $imageUrl = $request->input('image_url') ?: $request->input('image');
        if ($imageUrl && str_starts_with($imageUrl, 'data:')) {
            $imageData = explode(',', $imageUrl)[1];
            $ext = 'jpg';
            if (str_contains($imageUrl, 'png'))
                $ext = 'png';
            $filename = 'announcement_' . time() . '.' . $ext;
            \Illuminate\Support\Facades\Storage::disk('public')->put('announcements/' . $filename, base64_decode($imageData));
            $validated['image_url'] = 'announcements/' . $filename;
        }

        $announcement = Announcement::create($validated);

        // Send push notification based on target
        $title = "New Announcement: " . $announcement->title;
        $body = $announcement->content;

        // Generate the actual image URL from storage
        $actualImageUrl = $announcement->image_url ? asset('storage/' . $announcement->image_url) : null;

        // FOR TESTING: Use the public logo if the title contains "Test"
        if (str_contains(strtolower($announcement->title), 'test')) {
            $actualImageUrl = 'https://chithodehappykids.com/logo.png';
        }

        // Note: For local development (10.x.x.x), images might not show in notifications 
        // because Expo's cloud servers cannot access your local IP.
        $notificationData = [
            'screen' => 'announcements',
            'id' => $announcement->id,
            'image' => $actualImageUrl
        ];

        if ($announcement->target === 'all') {
            $this->notificationService->notifyAll($title, $body, $notificationData);
        } else {
            $this->notificationService->notifyRole($announcement->target, $title, $body, $notificationData);
        }

        return response()->json($announcement, 201);
    }

    public function destroy($id)
    {
        Announcement::destroy($id);
        return response()->json(['message' => 'Announcement deleted']);
    }
}
