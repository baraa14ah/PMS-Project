<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Services\StudentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StudentDirectoryController extends Controller
{
    protected StudentService $studentService;

    /** Initialize the controller with student service dependency. */
    public function __construct(StudentService $studentService)
    {
        $this->studentService = $studentService;
    }

    /** Check whether the user can access the project. */
    private function canAccess(Request $request, Project $project): bool
    {
        $u = $request->user();
        if (!$u) return false;

        return $project->user_id === $u->id
            || $project->supervisor_id === $u->id
            || DB::table('project_members')
                ->join('projects', 'project_members.project_id', '=', 'projects.id')
                ->where('projects.id', $project->id)
                ->where('projects.university_id', $u->university_id)
                ->where('project_members.student_id', $u->id)
                ->where('project_members.status', 'accepted')
                ->exists();
    }

    /** Return owner and members for a project. */
    public function studentsForProject(Request $request, $id)
    {
        $project = Project::query()->whereKey($id)->first();
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
