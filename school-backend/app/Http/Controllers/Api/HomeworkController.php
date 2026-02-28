<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Homework;

class HomeworkController extends Controller
{
    public function index()
    {
        return response()->json(Homework::latest()->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string',
            'description' => 'required|string',
            'subject' => 'nullable|string',
            'class_name' => 'nullable|string',
            'due_date' => 'required|string',
            'teacher_id' => 'required|integer',
        ]);

        $homework = Homework::create($validated);
        return response()->json($homework, 201);
    }
}
