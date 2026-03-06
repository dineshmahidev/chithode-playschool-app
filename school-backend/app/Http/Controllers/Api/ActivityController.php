<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Activity;
use App\Models\Comment;

class ActivityController extends Controller
{
    public function index()
    {
        return response()->json(Activity::with(['students', 'comments.user'])->latest()->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string',
            'description' => 'required|string',
            'media_type' => 'required|in:image,video',
            'media_url' => 'required|string',
            'thumbnail_url' => 'nullable|string',
            'date' => 'required|string',
            'author' => 'required|string',
            'student_ids' => 'required|array',
        ]);

        // Physical File Storage Support
        if (isset($request->all()['media_url']) && str_starts_with($request->media_url, 'data:')) {
            $data = explode(',', $request->media_url)[1];
            $ext = str_contains($request->media_url, 'video') ? 'mp4' : 'jpg';
            $filename = 'activity_' . time() . '.' . $ext;
            \Illuminate\Support\Facades\Storage::disk('public')->put('activities/' . $filename, base64_decode($data));
            $validated['media_url'] = 'activities/' . $filename;
        }

        if (isset($request->all()['thumbnail_url']) && str_starts_with($request->thumbnail_url, 'data:')) {
            $data = explode(',', $request->thumbnail_url)[1];
            $filename = 'activity_thumb_' . time() . '.jpg';
            \Illuminate\Support\Facades\Storage::disk('public')->put('activities/' . $filename, base64_decode($data));
            $validated['thumbnail_url'] = 'activities/' . $filename;
        }

        $activity = Activity::create($validated);
        $activity->students()->sync($request->student_ids);

        // Send push notification to tagged students
        $this->notifyTaggedUsers($activity, "New Activity: " . $activity->title, "You were mentioned in a new activity post by " . ($activity->author ?: 'Teacher'), 'activity');

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
            // Check individual user settings via the service logic or here
            // If we pass tokens to send(), we lose individual check.
            // Better to use notifyUser in a loop or update send() to handle array of users.
            $service->notifyUser($student->id, $title, $body, [
                'screen' => 'activityFeed',
                'id' => $activity->id,
                'image' => $activity->thumbnail_url ? asset('storage/' . $activity->thumbnail_url) : null
            ], $type);
        }
    }
}
