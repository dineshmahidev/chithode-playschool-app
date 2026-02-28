<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class StudentController extends Controller
{
    public function index()
    {
        return response()->json(User::where('role', 'student')->get());
    }

    public function show($id)
    {
        return response()->json(User::where('role', 'student')->findOrFail($id));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'email' => 'required|email|unique:users',
            'password' => 'required|string|min:6',
            'student_id' => 'required|string',
            'parent_name' => 'nullable|string',
            'address' => 'nullable|string',
            'status' => 'nullable|in:active,inactive',
        ]);

        $validated['password'] = Hash::make($request->password);
        $validated['role'] = 'student';

        $user = User::create($validated);
        return response()->json($user, 201);
    }
}
