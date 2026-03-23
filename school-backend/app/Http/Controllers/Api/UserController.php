<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index()
    {
        return response()->json(User::all());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'username' => 'required|string|unique:users,username',
            'date_of_birth' => 'nullable|date',
            'email' => 'nullable|email|unique:users,email',
            'password' => 'required|string|min:6',
            'role' => 'required|in:admin,teacher,student',
            'phone' => 'nullable|string',
            'gender' => 'nullable|string',
            'student_id' => 'nullable|string',
            'teacher_id' => 'nullable|string',
            'father_name' => 'nullable|string',
            'mother_name' => 'nullable|string',
            'father_phone' => 'nullable|string',
            'mother_phone' => 'nullable|string',
            'category' => 'nullable|in:Playschool,PreKG,Daycare',
            'status' => 'nullable|in:active,inactive',
            'parent_name' => 'nullable|string',
            'guardian_phone' => 'nullable|string',
            'blood_group' => 'nullable|string',
            'address' => 'nullable|string',
            'student_photo' => 'nullable|string',
            'father_photo' => 'nullable|string',
            'mother_photo' => 'nullable|string',
            'guardian_photo' => 'nullable|string',
            'fees' => 'nullable|string',
            'admission_date' => 'nullable|string',
            'fee_due_day' => 'nullable|string',
        ]);

        $validated['password'] = Hash::make($request->password);

        $user = User::create($validated);
        return response()->json($user, 201);
    }

    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string',
            'username' => 'sometimes|string|unique:users,username,' . $id,
            'date_of_birth' => 'nullable|date',
            'email' => 'nullable|email|unique:users,email,' . $id,
            'role' => 'sometimes|in:admin,teacher,student',
            'status' => 'sometimes|in:active,inactive',
            'phone' => 'nullable|string',
            'gender' => 'nullable|string',
            'father_name' => 'nullable|string',
            'mother_name' => 'nullable|string',
            'father_phone' => 'nullable|string',
            'mother_phone' => 'nullable|string',
            'category' => 'nullable|in:Playschool,PreKG,Daycare',
            'avatar' => 'nullable|string',
            'password' => 'sometimes|string|min:6',
            'parent_name' => 'nullable|string',
            'guardian_phone' => 'nullable|string',
            'blood_group' => 'nullable|string',
            'address' => 'nullable|string',
            'student_photo' => 'nullable|string',
            'father_photo' => 'nullable|string',
            'mother_photo' => 'nullable|string',
            'guardian_photo' => 'nullable|string',
            'fees' => 'nullable|string',
            'admission_date' => 'nullable|string',
            'student_id' => 'nullable|string',
            'teacher_id' => 'nullable|string',
            'fee_due_day' => 'nullable|string',
        ]);

        if ($request->has('password')) {
            $validated['password'] = Hash::make($request->password);
        }

        $user->update($validated);
        return response()->json($user);
    }

    public function destroy($id)
    {
        $user = User::findOrFail($id);
        $user->delete();
        return response()->json(['message' => 'User deleted successfully']);
    }
}
