<?php

namespace App\Services;

use Carbon\Carbon;
use App\Models\Project;
use App\Models\ProjectVersion;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use App\Services\NotificationService;
use App\Services\GithubService;

class ProjectVersionService
{
    protected NotificationService $notifications;
    protected GithubService $githubService;

    public function __construct(NotificationService $notifications, GithubService $githubService)
    {
        $this->notifications = $notifications;
        $this->githubService = $githubService;
    }

    /**
     * التحقق من الصلاحيات
     */
    private function canAccessProject($user, Project $project): bool
    {
        if (!$user) return false;
        $role = $user->role?->name;

        $isMember = DB::table('project_members')
            ->where('project_id', $project->id)
            ->where('student_id', $user->id)
            ->where('status', 'accepted')
            ->exists();

        return $role === 'admin' || $project->user_id === $user->id || $project->supervisor_id === $user->id || $isMember;
    }

    /**
     * رفع إصدار جديد
     */
    public function uploadVersion($data, $file, $user)
    {
        $project = Project::find($data['project_id']);
        if (!$project) return ['status' => 404, 'message' => 'Project not found'];
        if (!$this->canAccessProject($user, $project)) return ['status' => 403, 'message' => 'Unauthorized'];

        // حفظ الملف
        $path = $file->store('versions', 'public');

        $version = ProjectVersion::create([
            'project_id'          => $project->id,
            'user_id'             => $user->id,
            'version_title'       => $data['version_title'],
            'version_description' => $data['version_description'] ?? null,
            'file_path'           => $path,
        ]);

        // إرسال الإشعار
        try {
            $this->notifications->notifyProject(
                project: $project,
                type: 'version_uploaded',
                title: 'تم رفع إصدار جديد',
                body: "قام {$user->name} برفع إصدار: {$version->version_title} داخل مشروع {$project->title}",
                data: [
                    'project_id' => $project->id,
                    'version_id' => $version->id,
                    'url'        => "/dashboard/projects/{$project->id}",
                ],
                ignoreUserId: $user->id
            );
        } catch (\Throwable $e) {}

        return ['status' => 201, 'message' => 'Version uploaded successfully', 'version' => $version->load('user:id,name')];
    }

    /**
     * جلب قائمة الإصدارات
     */
    public function getVersions($projectId, $user)
    {
        $project = Project::find($projectId);
        if (!$project) return ['status' => 404, 'message' => 'Project not found'];
        if (!$this->canAccessProject($user, $project)) return ['status' => 403, 'message' => 'Unauthorized'];

        $versions = ProjectVersion::where('project_id', $projectId)
            ->with('user:id,name')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn($v) => [
                'id'                  => $v->id,
                'user_id'             => $v->user_id,
                'version_title'       => $v->version_title,
                'version_description' => $v->version_description,
                'file_url'            => $v->file_path ? asset('storage/' . $v->file_path) : null,
                'uploaded_by'         => $v->user?->name,
                'created_at'          => $v->created_at,
            ]);

        return ['status' => 200, 'versions' => $versions];
    }

    /**
     * حذف إصدار
     */
    public function deleteVersion($versionId, $user)
    {
        $version = ProjectVersion::find($versionId);
        if (!$version) return ['status' => 404, 'message' => 'Version not found'];

        $project = Project::find($version->project_id);
        
        $isAdmin = $user->role?->name === 'admin';
        $isOwnerProject = $project->user_id === $user->id;
        $isOwnerVersion = $version->user_id === $user->id;

        if (!($isAdmin || $isOwnerProject || $isOwnerVersion)) {
            return ['status' => 403, 'message' => 'Unauthorized'];
        }

        if ($version->file_path && Storage::disk('public')->exists($version->file_path)) {
            Storage::disk('public')->delete($version->file_path);
        }

        $version->delete();
        return ['status' => 200, 'message' => 'Version deleted successfully'];
    }

    /**
     * بناء الـ Timeline
     */
    public function getTimeline($projectId, $user)
    {
        $project = Project::find($projectId);
        if (!$project) return ['status' => 404, 'message' => 'Project not found'];
        if (!$this->canAccessProject($user, $project)) return ['status' => 403, 'message' => 'Unauthorized'];

        $versions = ProjectVersion::where('project_id', $projectId)->with('user:id,name')->orderBy('created_at', 'desc')->get();

        $timeline = $versions->groupBy(fn ($v) => Carbon::parse($v->created_at)->format('F Y'))->map(function ($items, $month) {
            return [
                'month' => $month,
                'versions' => $items->map(fn ($v) => [
                    'id' => $v->id,
                    'version_title' => $v->version_title,
                    'created_at' => Carbon::parse($v->created_at)->format('Y-m-d H:i'),
                ])->values()
            ];
        })->values();

        return ['status' => 200, 'timeline' => $timeline];
    }

    /**
     * دفع الإصدار إلى جيتهاب
     */
 /**
     * دفع الإصدار إلى جيتهاب
     */
    public function pushToGithub($versionId, $user)
    {
        $version = ProjectVersion::find($versionId);
        if (!$version) return ['status' => 404, 'message' => 'Version not found'];

        $project = Project::find($version->project_id);
        if (!$this->canAccessProject($user, $project)) return ['status' => 403, 'message' => 'Unauthorized'];

        // ✅ أضفنا $version->version_description هنا لكي نستخدمه كرسالة للكوميت
        return $this->githubService->pushVersionToGithub(
            $project, 
            $version->version_title, 
            $version->version_description, // <-- التعديل هنا
            $version->file_path
        );
    }
    /**
     * إرسال إشعار لجميع أعضاء المشروع (المالك، المشرف، الأعضاء المقبولين)
     * مع استثناء المستخدم الذي قام بالحدث (ignoreUserId)
     */
    public function notifyProject(\App\Models\Project $project, string $type, string $title, string $body, array $data = [], int $ignoreUserId = null)
    {
        // 1. تجميع كل المعنيين بالمشروع في مصفوفة
        $userIds = [];

        // إضافة صاحب المشروع
        if ($project->user_id) {
            $userIds[] = $project->user_id;
        }

        // إضافة المشرف (إن وجد)
        if ($project->supervisor_id) {
            $userIds[] = $project->supervisor_id;
        }

        // إضافة جميع الطلاب المقبولين في المشروع
        $members = \Illuminate\Support\Facades\DB::table('project_members')
            ->where('project_id', $project->id)
            ->where('status', 'accepted')
            ->pluck('student_id')
            ->toArray();
        
        $userIds = array_merge($userIds, $members);

        // إزالة التكرار (في حال كان المالك هو نفسه عضو بطريقة ما)
        $userIds = array_unique($userIds);

        // 2. إزالة الشخص الذي قام بالحدث (حتى لا يصله إشعار بأنه رفع ملف)
        if ($ignoreUserId) {
            $userIds = array_diff($userIds, [$ignoreUserId]);
        }

        // 3. إنشاء الإشعارات في قاعدة البيانات
        foreach ($userIds as $userId) {
            \App\Models\Notification::create([
                'user_id' => $userId,
                'type'    => $type,
                'title'   => $title,
                'body'    => $body,
                'data'    => $data, // إذا كان الـ casting مفعل كـ array في المودل، أو استخدم json_encode($data)
            ]);
        }
    }
}