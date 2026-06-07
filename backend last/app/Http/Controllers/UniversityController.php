<?php

namespace App\Http\Controllers;

use App\Models\University;
use Illuminate\Http\Request;

class UniversityController extends Controller
{
    /** List active universities for public registration. */
    public function publicList()
    {
        $universities = University::active()
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        return response()->json(['universities' => $universities]);
    }

    /** List all universities for platform admin. */
    public function index()
    {
        $universities = University::orderBy('name')->get();

        return response()->json(['universities' => $universities]);
    }

    /** Create a new university. */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:universities,slug',
        ]);

        $university = University::create([
            'name'      => $request->name,
            'slug'      => $request->slug,
            'is_active' => true,
        ]);

        return response()->json([
            'message'    => 'University created successfully.',
            'university' => $university,
        ], 201);
    }

    /** Update an existing university. */
    public function update(Request $request, $id)
    {
        $university = University::find($id);

        if (!$university) {
            return response()->json(['message' => 'University not found.'], 404);
        }

        $request->validate([
            'name'      => 'sometimes|string|max:255',
            'slug'      => 'sometimes|nullable|string|max:255|unique:universities,slug,' . $id,
            'is_active' => 'sometimes|boolean',
        ]);

        $university->update($request->only(['name', 'slug', 'is_active']));

        return response()->json([
            'message'    => 'University updated successfully.',
            'university' => $university->fresh(),
        ]);
    }
}
