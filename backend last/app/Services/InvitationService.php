<?php

namespace App\Services;

use App\Models\Project;
use App\Models\StudentInvitation;
use App\Models\SupervisorInvitation;
use App\Models\ProjectActivity; // 🎯 استدعاء الموديل
use Illuminate\Support\Facades\DB;

class InvitationService
{
    public function inviteStudent($projectId, $studentId, $senderId)
    {
        $project = Project::find($projectId);
        if (!$project) return ['status' => 404, 'message' => 'Project not found'];

        if ((int)$studentId === (int)$project->user_id) {
            return ['status' => 422, 'message' => 'This student is the project owner'];
        }

        $isMember = DB::table('project_members')
            ->where('project_id', $projectId)
            ->where('student_id', $studentId)
            ->exists();
        if ($isMember) return ['status' => 422, 'message' => 'Student already in this project'];

        $invitation = StudentInvitation::updateOrCreate(
            ['project_id' => $projectId, 'student_id' => $studentId],
            ['sent_by_id' => $senderId, 'status' => 'pending']
        );

        return ['status' => 201, 'invitation' => $invitation];
    }

    public function getStudentInvitations($studentId)
    {
        return StudentInvitation::where('student_id', $studentId)
            ->where('status', 'pending')
            ->with(['project:id,title', 'sender:id,name,email'])
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function acceptStudentInvitation($inviteId, $user)
    {
        $inv = StudentInvitation::find($inviteId);
        if (!$inv || (int)$inv->student_id !== (int)$user->id) {
            return ['status' => 403, 'message' => 'Unauthorized'];
        }

        if ($inv->status !== 'pending') return ['status' => 422, 'message' => 'Processed already'];

        DB::transaction(function () use ($inv, $user) {
            DB::table('project_members')->updateOrInsert(
                ['project_id' => $inv->project_id, 'student_id' => $user->id],
                ['status' => 'accepted', 'updated_at' => now()]
            );
            $inv->update(['status' => 'accepted']);
        });

        // 🎯 تسجيل نشاط انضمام الطالب
        ProjectActivity::create([
            'project_id' => $inv->project_id,
            'user_id' => $user->id,
            'action' => 'انضم إلى المشروع كعضو فريق',
            'type' => 'join'
        ]);

        return ['status' => 200, 'message' => 'Accepted'];
    }

    public function inviteSupervisor($projectId, $supervisorId, $studentId)
    {
        $project = Project::find($projectId);
        if (!$project) return ['status' => 404, 'message' => 'Project not found'];

        $exists = SupervisorInvitation::where('project_id', $projectId)
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

    public function getSupervisorInvitations($supervisorId)
    {
        return SupervisorInvitation::where('supervisor_id', $supervisorId)
            ->where('status', 'pending')
            ->with(['project:id,title', 'student:id,name,email'])
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function acceptSupervisorInvitation($inviteId, $user)
    {
        $inv = SupervisorInvitation::where('id', $inviteId)
            ->where('supervisor_id', $user->id)
            ->where('status', 'pending')
            ->first();

        if (!$inv) return ['status' => 404, 'message' => 'Invitation not found'];

        DB::transaction(function () use ($inv, $user) {
            $inv->update(['status' => 'accepted']);
            Project::where('id', $inv->project_id)->update(['supervisor_id' => $user->id]);
        });

        // 🎯 تسجيل نشاط انضمام المشرف
        ProjectActivity::create([
            'project_id' => $inv->project_id,
            'user_id' => $user->id,
            'action' => 'انضم إلى المشروع كمشرف',
            'type' => 'join'
        ]);

        return ['status' => 200, 'message' => 'Accepted'];
    }
}