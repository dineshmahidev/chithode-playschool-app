<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Announcement;

class AnnouncementController extends Controller
{
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
        return response()->json($announcement, 201);
    }

    public function destroy($id)
    {
        Announcement::destroy($id);
        return response()->json(['message' => 'Announcement deleted']);
    }
}
