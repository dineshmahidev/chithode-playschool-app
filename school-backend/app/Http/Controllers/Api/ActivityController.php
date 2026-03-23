<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Activity;
use App\Models\Comment;
use Illuminate\Support\Facades\Log;

class ActivityController extends Controller
{
    public function index()
    {
        return response()->json(Activity::with(['students', 'comments.user'])->latest()->get());
    }

    public function store(Request $request)
    {
        Log::info('Activity Store Request Payload:', $request->all());

        $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
            'title' => 'required|string',
            'description' => 'required|string',
            'media_type' => 'required|in:image,video',
            'date' => 'required|string',
            'author' => 'required|string',
            'student_ids' => 'required|array',
            'media_file' => 'nullable|file|max:102400', // 100MB
            'thumbnail_file' => 'nullable|file|max:10240', // 10MB
        ]);

        if ($validator->fails()) {
            Log::error('ACTIVITY_VALIDATION_ERROR_LOG:', [
                'errors' => $validator->errors()->toArray(),
                'request' => $request->all()
            ]);
            return response()->json([
                'message' => 'ACTIVITY_VALIDATION_ERROR',
                'errors' => $validator->errors()
            ], 422);
        }

        $validated = $validator->validated();
        $validated['media_url'] = $request->input('media_url');
        $validated['thumbnail_url'] = $request->input('thumbnail_url');

        // 1. Handle Media URL (Base64 Fallback or Physical Upload)
        if ($request->hasFile('media_file')) {
            $file = $request->file('media_file');
            $ext = $file->getClientOriginalExtension() ?: ($request->media_type === 'video' ? 'mp4' : 'jpg');
            $filename = 'activity_' . time() . '_' . rand(100, 999) . '.' . $ext;
            
            Log::info('Saving physical media file:', ['filename' => $filename, 'type' => $file->getMimeType()]);
            $path = $file->storeAs('activities', $filename, 'public');
            $validated['media_url'] = $path;
        } elseif (isset($request->all()['media_url']) && str_starts_with($request->media_url, 'data:')) {
            Log::info('Saving base64 media data...');
            $data = explode(',', $request->media_url)[1];
            $ext = str_contains($request->media_url, 'video') ? 'mp4' : 'jpg';
            $filename = 'activity_' . time() . '.' . $ext;
            \Illuminate\Support\Facades\Storage::disk('public')->put('activities/' . $filename, base64_decode($data));
            $validated['media_url'] = 'activities/' . $filename;
        }

        // 2. Handle Thumbnail URL (Physical or Base64)
        if ($request->hasFile('thumbnail_file')) {
            $file = $request->file('thumbnail_file');
            $ext = $file->getClientOriginalExtension() ?: 'jpg';
            $filename = 'thumb_' . time() . '_' . rand(100, 999) . '.' . $ext;
            
            Log::info('Saving physical thumbnail:', ['filename' => $filename]);
            $path = $file->storeAs('activities/thumbs', $filename, 'public');
            $validated['thumbnail_url'] = $path;
        } elseif (isset($request->all()['thumbnail_url']) && str_starts_with($request->thumbnail_url, 'data:')) {
            $data = explode(',', $request->thumbnail_url)[1];
            $filename = 'activity_thumb_' . time() . '.jpg';
            \Illuminate\Support\Facades\Storage::disk('public')->put('activities/' . $filename, base64_decode($data));
            $validated['thumbnail_url'] = 'activities/' . $filename;
        }

        Log::info('Final Save Paths:', [
            'media' => $validated['media_url'] ?? 'none',
            'thumb' => $validated['thumbnail_url'] ?? 'none'
        ]);

        $activity = Activity::create($validated);
        $activity->students()->sync($request->student_ids);

        // Send push notification to tagged students
        $this->notifyTaggedUsers($activity, "New Activity: " . $activity->title, "Tagged Mention: " . ($activity->author ?: 'Teacher'), 'activity');

        return response()->json($activity->load(['students', 'comments.user']), 201);
    }

    public function destroy($id)
    {
        $activity = Activity::findOrFail($id);
        $activity->students()->detach();
        $activity->delete();

        return response()->json(['message' => 'Activity deleted successfully']);
    }

    public function like($id)
    {
        $activity = Activity::findOrFail($id);
        $activity->increment('likes_count');

        // Notify tagged students/parents
        $this->notifyTaggedUsers(
            $activity,
            "Activity Liked ❤️",
            "Someone liked an activity your child is tagged in: " . $activity->title,
            'activity'
        );

        return response()->json($activity->load(['students', 'comments.user']));
    }

    public function comment(Request $request, $id)
    {
        $request->validate([
            'text' => 'required|string',
        ]);

        $comment = Comment::create([
            'activity_id' => $id,
            'user_id' => $request->user()->id,
            'text' => $request->text,
        ]);

        $activity = Activity::findOrFail($id);

        // Notify tagged students/parents
        $this->notifyTaggedUsers(
            $activity,
            "New Comment on Activity 💬",
            $request->user()->name . " commented: " . $request->text,
            'activity'
        );

        return response()->json($comment->load('user'), 201);
    }

    /**
     * Helper to notify all students/users tagged in an activity
     */
    private function notifyTaggedUsers(Activity $activity, $title, $body, $type = 'activity')
    {
        $students = $activity->students()
            ->whereNotNull('push_token')
            ->get();

        $tokens = [];
        $service = app(\App\Services\ExpoNotificationService::class);

        foreach ($students as $student) {
            // Determine the best image for the notification
            $imagePath = $activity->thumbnail_url ?: $activity->media_url;
            $fullImageUrl = $imagePath ? asset('storage/' . $imagePath) : null;

            // FOR TESTING: Use the public logo if the title contains "Test"
            if (str_contains(strtolower($activity->title), 'test')) {
                $fullImageUrl = 'https://chithodehappykids.com/logo.png';
            }

            $service->notifyUser($student->id, $title, $body, [
                'screen' => 'activityFeed',
                'id' => $activity->id,
                'image' => $fullImageUrl
            ], $type);
        }

    }
}
