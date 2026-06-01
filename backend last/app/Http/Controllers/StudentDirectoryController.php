<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Services\StudentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StudentDirectoryController extends Controller
{
    protected StudentService $studentService;

    public function __construct(StudentService $studentService)
    {
        $this->studentService = $studentService;
    }

    private function canAccess(Request $request, Project $project): bool
    {
        $u = $request->user();
        if (!$u) return false;

        $role = $u->role?->name ?? $u->role;

        return $role === 'admin'
            || $project->user_id === $u->id
            || $project->supervisor_id === $u->id
            || DB::table('project_members')
                ->where('project_id', $project->id)
                ->where('student_id', $u->id)
                ->where('status', 'accepted')
                ->exists();
    }

    /**
     * عرض أعضاء المشروع
     */
    public function studentsForProject(Request $request, $id)
    {
        $project = Project::find($id);
        if (!$project) return response()->json(['message' => 'Project not found'], 404);

        if (!$this->canAccess($request, $project)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $data = $this->studentService->getProjectMembers($id);

        return response()->json([
            'project_id' => $id,
            'owner' => $data['owner'],
            'members' => $data['members'],
        ]);
    }
}