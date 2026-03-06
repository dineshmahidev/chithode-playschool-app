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

        // FOR LOCAL DEV: Use a public mock image for notification preview
        // Expo cloud CANNOT access local IP 10.x.x.x to download your images.
        $previewUrl = "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=400";

        if ($announcement->target === 'all') {
            $this->notificationService->notifyAll($title, $body, [
                'screen' => 'announcements',
                'id' => $announcement->id,
                'image' => $previewUrl
            ]);
        } else {
            $this->notificationService->notifyRole($announcement->target, $title, $body, [
                'screen' => 'announcements',
                'id' => $announcement->id,
                'image' => $previewUrl
            ]);
        }

        return response()->json($announcement, 201);
    }

    public function destroy($id)
    {
        Announcement::destroy($id);
        return response()->json(['message' => 'Announcement deleted']);
    }
}
