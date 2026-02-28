<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Camera;
use Illuminate\Http\Request;

class CameraController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return response()->json(Camera::all());
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'url' => 'required|url',
            'status' => 'nullable|string|in:online,offline',
        ]);

        $camera = Camera::create($validated);

        return response()->json($camera, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Camera $camera)
    {
        return response()->json($camera);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Camera $camera)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'url' => 'sometimes|required|url',
            'status' => 'sometimes|required|string|in:online,offline',
        ]);

        $camera->update($validated);

        return response()->json($camera);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Camera $camera)
    {
        $camera->delete();

        return response()->json(null, 204);
    }
}
