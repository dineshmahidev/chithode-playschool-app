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

        $activity = Activity::create($validated);
        $activity->students()->sync($request->student_ids);

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

        return response()->json($comment->load('user'), 201);
    }
}
