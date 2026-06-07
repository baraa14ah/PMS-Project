<?php

namespace App\Services;

use App\Models\Project;
use App\Models\StudentInvitation;
use App\Models\SupervisorInvitation;
use App\Models\ProjectActivity;
use Illuminate\Support\Facades\DB;

class InvitationService
{
    /** Sends a student invitation to join a project. */
    public function inviteStudent($projectId, $studentId, $senderId)
    {
        $project = Project::query()->whereKey($projectId)->first();
        if (!$project) return ['status' => 404, 'message' => 'Project not found'];

        if ((int)$studentId === (int)$project->user_id) {
            return ['status' => 422, 'message' => 'This student is the project owner'];
        }

        $studentAllowed = \App\Models\User::query()
            ->whereKey($studentId)
            ->where('status', 'active')
            ->whereHas('role', fn ($q) => $q->where('name', 'student'))
            ->inUniversity($project->university_id)
            ->exists();
        if (!$studentAllowed) {
            return ['status' => 422, 'message' => 'Student is not affiliated with this university.'];
        }

        $isMember = DB::table('project_members')
            ->join('projects', 'project_members.project_id', '=', 'projects.id')
            ->where('projects.id', $projectId)
            ->where('projects.university_id', auth()->user()->university_id)
            ->where('project_members.student_id', $studentId)
            ->exists();
        if ($isMember) return ['status' => 422, 'message' => 'Student already in this project'];

        $invitation = StudentInvitation::updateOrCreate(
            ['project_id' => $projectId, 'student_id' => $studentId],
            ['sent_by_id' => $senderId, 'status' => 'pending']
        );

        return ['status' => 201, 'invitation' => $invitation];
    }

    /** Returns pending student invitations for the given student. */
    public function getStudentInvitations($studentId)
    {
        return StudentInvitation::query()->forCurrentUniversity()
            ->where('student_id', $studentId)
            ->where('status', 'pending')
            ->with(['project:id,title', 'sender:id,name,email'])
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /** Accepts a student invitation and adds the student as a project member. */
    public function acceptStudentInvitation($inviteId, $user)
    {
        $inv = StudentInvitation::query()->forCurrentUniversity()->whereKey($inviteId)->first();
        if (!$inv || (int)$inv->student_id !== (int)$user->id) {
            return ['status' => 404, 'message' => 'Resource not found.'];
        }

        if ($inv->status !== 'pending') return ['status' => 422, 'message' => 'Processed already'];

        DB::transaction(function () use ($inv, $user) {
            DB::table('project_members')->updateOrInsert(
                ['project_id' => $inv->project_id, 'student_id' => $user->id],
                ['status' => 'accepted', 'updated_at' => now()]
            );
            $inv->update(['status' => 'accepted']);
        });

        ProjectActivity::create([
            'project_id' => $inv->project_id,
            'user_id' => $user->id,
            'action' => 'انضم إلى المشروع كعضو فريق',
            'action_key' => 'memberJoined',
            'meta' => [],
            'type' => 'join',
        ]);

        return ['status' => 200, 'message' => 'Accepted'];
    }

    /** Sends a supervisor invitation for a project. */
    public function inviteSupervisor($projectId, $supervisorId, $studentId)
    {
        $project = Project::query()->whereKey($projectId)->first();
        if (!$project) return ['status' => 404, 'message' => 'Project not found'];

        $supervisorAllowed = \App\Models\User::query()
            ->whereKey($supervisorId)
            ->where('status', 'active')
            ->whereHas('role', fn ($q) => $q->where('name', 'supervisor'))
            ->whereHas('supervisorUniversities', function ($q) use ($project) {
                $q->where('universities.id', $project->university_id)
                    ->where('supervisor_universities.status', 'active')
                    ->where('supervisor_universities.accepting_supervision', true);
            })
            ->exists();
        if (!$supervisorAllowed) {
            return ['status' => 422, 'message' => 'Supervisor is not available for supervision at this university.'];
        }

        $exists = SupervisorInvitation::query()->forCurrentUniversity()
            ->where('project_id', $projectId)
            ->where('supervisor_id', $supervisorId)
            ->where('status', 'pending')
            ->exists();
        if ($exists) return ['status' => 422, 'message' => 'Pending invitation already exists'];

        $invitation = SupervisorInvitation::create([
            'project_id' => $projectId,
            'student_id' => $studentId,
            'supervisor_id' => $supervisorId,
            'status' => 'pending'
        ]);

        return ['status' => 201, 'invitation' => $invitation];
    }

    /** Returns pending supervisor invitations for the given supervisor. */
    public function getSupervisorInvitations($supervisorId)
    {
        return SupervisorInvitation::query()->forCurrentUniversity()
            ->where('supervisor_id', $supervisorId)
            ->where('status', 'pending')
            ->with(['project:id,title', 'student:id,name,email'])
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /** Accepts a supervisor invitation and assigns the supervisor to the project. */
    public function acceptSupervisorInvitation($inviteId, $user)
    {
        $inv = SupervisorInvitation::query()->forCurrentUniversity()
            ->where('id', $inviteId)
            ->where('supervisor_id', $user->id)
            ->where('status', 'pending')
            ->first();

        if (!$inv) return ['status' => 404, 'message' => 'Resource not found.'];

        DB::transaction(function () use ($inv, $user) {
            $inv->update(['status' => 'accepted']);
            Project::query()->whereKey($inv->project_id)->update(['supervisor_id' => $user->id]);
        });

        ProjectActivity::create([
            'project_id' => $inv->project_id,
            'user_id' => $user->id,
            'action' => 'انضم إلى المشروع كمشرف',
            'action_key' => 'supervisorJoined',
            'meta' => [],
            'type' => 'join',
        ]);

        return ['status' => 200, 'message' => 'Accepted'];
    }
}
