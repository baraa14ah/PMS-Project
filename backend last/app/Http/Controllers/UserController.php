<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Project; // 🎯 استدعاء مودل المشاريع
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB; // 🎯 استدعاء DB للتعامل مع العمليات (Transactions) والجداول الوسيطة
use Illuminate\Support\Facades\Hash;
class UserController extends Controller
{
    // جلب كل المستخدمين
    public function index(Request $request)
    {
        $query = User::query()
            ->with(['role', 'supervisorUniversities:id,name'])
            ->forTenantAdminListing()
            ->applyUserListFilters($request)
            ->orderBy('created_at', 'desc');

        $users = $query->get();

        return response()->json([
            'users' => $users
        ], 200);
    }

    // List pending users for admin (US2)
    public function pending(Request $request)
    {
        $users = User::query()
            ->with(['role', 'supervisorUniversities:id,name'])
            ->forTenantAdminListing()
            ->where('status', 'pending')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'users' => $users
        ], 200);
    }

    // Approve a pending user (US2)
    public function approve($id)
    {
        $user = User::query()->forTenantAdminListing()->whereKey($id)->first();

        if (!$user) {
            return response()->json(['message' => 'User not found in your university.'], 404);
        }

        if ($user->status !== 'pending') {
            return response()->json(['message' => 'User is not pending approval.'], 422);
        }

        $user->status = 'active';
        $user->save();

        return response()->json([
            'message' => 'User approved successfully.',
            'user' => $user->load('role')
        ], 200);
    }

    // Reject a pending user (US2)
    public function reject($id)
    {
        $user = User::query()->forTenantAdminListing()->whereKey($id)->first();

        if (!$user) {
            return response()->json(['message' => 'User not found in your university.'], 404);
        }

        if ($user->status !== 'pending') {
            return response()->json(['message' => 'User is not pending approval.'], 422);
        }

        $user->status = 'rejected';
        $user->save();

        return response()->json([
            'message' => 'User rejected successfully.',
            'user' => $user->load('role')
        ], 200);
    }
    // 🎯 دالة إضافة مستخدم جديد
    public function store(Request $request)
    {
        $rules = [
            'name'  => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'role'  => 'required|string|in:supervisor,student',
        ];

        if ($request->role === 'student') {
            $rules['student_number'] = [
                'required',
                'string',
                'max:50',
                \Illuminate\Validation\Rule::unique('users', 'student_number')
                    ->where(fn ($q) => $q->where('university_id', auth()->user()->university_id)),
            ];
        }

        $request->validate($rules);

        // نجلب الـ id الخاص بالصلاحية المطلوبة (بناءً على جدول الأدوار لديك)
        $role = \App\Models\Role::where('name', $request->role)->first();
        
        if (!$role) {
            return response()->json(['message' => 'حدث خطأ: الصلاحية المحددة غير موجودة في النظام'], 400);
        }

        // إنشاء المستخدم
        $user = User::create([
            'name'           => $request->name,
            'email'          => $request->email,
            'password'       => '12345678',
            'role_id'        => $role->id,
            'university_id'  => auth()->user()->university_id,
            'student_number' => $request->role === 'student' ? $request->student_number : null,
            'status'         => 'active',
        ]);

        if ($request->role === 'student' && $request->student_number) {
            $user->profile()->updateOrCreate(
                ['user_id' => $user->id],
                ['student_number' => $request->student_number],
            );
        }

        if ($user->isSupervisorRole()) {
            $user->syncSupervisorUniversities([auth()->user()->university_id]);
        }

        $user->load(['role', 'supervisorUniversities:id,name']);

        return response()->json([
            'message' => 'تم إضافة المستخدم بنجاح',
            'user' => $user
        ], 201);
    }

    // دالة تعديل بيانات المستخدم
    public function update(Request $request, $id)
    {
        $user = User::query()->forTenantAdminListing()->whereKey($id)->first();
        if (!$user) {
            return response()->json(['message' => 'المستخدم غير موجود'], 404);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $id,
        ]);

        $user->name = $request->name;
        $user->email = $request->email;
        $user->save();

        return response()->json(['message' => 'تم تحديث البيانات بنجاح']);
    }

    // 🎯 دالة حذف المستخدم مع "نقل الملكية السلس" أو "الحذف الآمن"
    public function destroy($id)
    {
        DB::beginTransaction();

        try {
            $user = User::query()
                ->with('role')
                ->forTenantAdminListing()
                ->whereKey($id)
                ->first();

            if (!$user) {
                return response()->json(['message' => 'المستخدم غير موجود في جامعتك.'], 404);
            }

            $roleName = strtolower($user->role->name ?? '');
            if (in_array($roleName, ['admin', 'super_admin'], true)) {
                return response()->json(['message' => 'لا يمكن حذف حساب مدير النظام.'], 403);
            }

            $uniId = (int) $user->university_id;

            // 1. مشاريع يملكها — نقل الملكية أو حذف المشروع
            $ownedProjects = Project::query()
                ->when($uniId, fn ($q) => $q->where('university_id', $uniId))
                ->where('user_id', $id)
                ->get();

            foreach ($ownedProjects as $project) {
                $otherMember = DB::table('project_members')
                    ->where('project_id', $project->id)
                    ->where('student_id', '!=', $id)
                    ->where('status', 'accepted')
                    ->orderBy('created_at')
                    ->first();

                if ($otherMember) {
                    $project->user_id = $otherMember->student_id;
                    $project->save();
                    DB::table('project_members')
                        ->where('project_id', $project->id)
                        ->where('student_id', $otherMember->student_id)
                        ->delete();
                } else {
                    DB::table('project_members')->where('project_id', $project->id)->delete();
                    DB::table('student_invitations')->where('project_id', $project->id)->delete();
                    DB::table('supervisor_invitations')->where('project_id', $project->id)->delete();
                    $project->delete();
                }
            }

            // 2. فك الارتباطات المباشرة
            DB::table('project_members')->where('student_id', $id)->delete();
            DB::table('tasks')->where('assigned_to', $id)->update(['assigned_to' => null]);
            Project::query()->where('supervisor_id', $id)->update(['supervisor_id' => null]);
            DB::table('supervisor_universities')->where('user_id', $id)->delete();
            DB::table('project_user')->where('user_id', $id)->delete();

            DB::table('student_invitations')
                ->where('student_id', $id)
                ->orWhere('sent_by_id', $id)
                ->delete();
            DB::table('supervisor_invitations')
                ->where('supervisor_id', $id)
                ->orWhere('student_id', $id)
                ->delete();

            DB::table('comments')->where('user_id', $id)->delete();
            DB::table('project_versions')->where('user_id', $id)->delete();
            DB::table('project_activities')->where('user_id', $id)->delete();
            DB::table('ratings')->where('user_id', $id)->delete();
            DB::table('password_reset_requests')->where('user_id', $id)->delete();

            DB::table('notifications')
                ->where('notifiable_type', User::class)
                ->where('notifiable_id', $id)
                ->delete();

            DB::table('personal_access_tokens')
                ->where('tokenable_type', User::class)
                ->where('tokenable_id', $id)
                ->delete();

            $user->delete();

            DB::commit();
            return response()->json(['message' => 'تم حذف المستخدم بنجاح.']);

        } catch (\Illuminate\Database\QueryException $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'تعذر الحذف — يوجد ارتباط في قاعدة البيانات: ' . $e->getMessage(),
            ], 400);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'تعذر حذف المستخدم: ' . $e->getMessage()], 500);
        }
    }
 
    // جلب المشرفين
    public function supervisors(Request $request)
    {
        if (!$request->user()) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $supervisors = User::query()
            ->whereHas('role', function ($q) {
                $q->where('name', 'supervisor');
            })
            ->inUniversity($request->user()->university_id)
            ->select('id', 'name', 'email')
            ->orderBy('name')
            ->get();

        return response()->json(['supervisors' => $supervisors]);
    }
}