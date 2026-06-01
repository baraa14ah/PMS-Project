<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\InvitationService;
use App\Models\User;
use App\Models\SupervisorInvitation;

class SupervisorInvitationController extends Controller
{
    protected InvitationService $invitationService;

    public function __construct(InvitationService $invitationService)
    {
        $this->invitationService = $invitationService;
    }

    public function inviteSupervisor(Request $request, $projectId)
    {
        $request->validate(['supervisor_id' => 'required|exists:users,id']);
        $result = $this->invitationService->inviteSupervisor($projectId, $request->supervisor_id, $request->user()->id);
        return response()->json($result, $result['status']);
    }

    public function myInvitations(Request $request)
    {
        $user = $request->user();
        $invitations = $this->invitationService->getSupervisorInvitations($user->id);
        return response()->json(['invitations' => $invitations]);
    }

    public function accept(Request $request, $inviteId)
    {
        $result = $this->invitationService->acceptSupervisorInvitation($inviteId, $request->user());
        return response()->json($result, $result['status']);
    }

    public function reject(Request $request, $inviteId)
    {
        $inv = SupervisorInvitation::where('id', $inviteId)->where('supervisor_id', $request->user()->id)->first();
        if (!$inv) return response()->json(['message' => 'Not found'], 404);
        $inv->update(['status' => 'rejected']);
        return response()->json(['message' => 'Rejected']);
    }

    public function supervisorsList(Request $request)
    {
        $supervisors = User::whereHas('role', fn($q) => $q->where('name', 'supervisor'))
            ->select('id', 'name', 'email')->get();
        return response()->json(['supervisors' => $supervisors]);
    }
}