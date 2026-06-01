<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\InvitationService;
use App\Models\StudentInvitation;
use App\Models\User;

class StudentInvitationController extends Controller
{
    protected InvitationService $invitationService;

    public function __construct(InvitationService $invitationService)
    {
        $this->invitationService = $invitationService;
    }

    public function invite(Request $request, $projectId)
    {
        $request->validate(['student_id' => 'required|integer|exists:users,id']);
        $result = $this->invitationService->inviteStudent($projectId, $request->student_id, $request->user()->id);
        return response()->json($result, $result['status']);
    }

    public function myInvitations(Request $request)
    {
        $invitations = $this->invitationService->getStudentInvitations($request->user()->id);
        return response()->json(['invitations' => $invitations]);
    }

    public function accept(Request $request, $inviteId)
    {
        $result = $this->invitationService->acceptStudentInvitation($inviteId, $request->user());
        return response()->json($result, $result['status']);
    }

    public function reject(Request $request, $inviteId)
    {
        $inv = StudentInvitation::where('id', $inviteId)->where('student_id', $request->user()->id)->first();
        if (!$inv) return response()->json(['message' => 'Not found'], 404);
        $inv->update(['status' => 'rejected']);
        return response()->json(['message' => 'Rejected']);
    }
public function studentsList(Request $request)
    {
        // جلب كل المستخدمين وفلترتهم برمجياً لتجنب أي خطأ 500
        $students = \App\Models\User::get()
            ->filter(function ($user) {
                // فحص الصلاحية بأمان تام
                $roleName = is_string($user->role) ? strtolower($user->role) : strtolower($user->role?->name ?? '');
                return $roleName === 'student';
            })
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                ];
            })
            ->values();

        return response()->json(['students' => $students]);
    }
}