<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\ProjectVersion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Services\NotificationService;
use App\Services\ProjectVersionService;

class ProjectVersionController extends Controller
{
    protected NotificationService $notifications;

    public function __construct(NotificationService $notifications)
    {
        $this->notifications = $notifications;
    }

    private function canAccessProject(Request $request, Project $project): bool
    {
        $user = $request->user();
        if (!$user) return false;
        
        return $user->role?->name === 'admin'
            || $project->user_id === $user->id
            || $project->supervisor_id === $user->id
            || DB::table('project_members')->where('project_id', $project->id)->where('student_id', $user->id)->where('status', 'accepted')->exists();
    }

    // 1. عرض الإصدارات
    public function index(Request $request, $projectId)
    {
        $project = Project::find($projectId);
        if (!$project) return response()->json(['message' => 'Project not found'], 404);

        if (!$this->canAccessProject($request, $project)) return response()->json(['message' => 'Unauthorized'], 403);

        $versions = ProjectVersion::where('project_id', $projectId)
            ->with('user:id,name')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'project_id' => $projectId,
            'versions' => $versions->map(fn($v) => [
                'id' => $v->id,
                'user_id'=> $v->user_id,
                'version_title' => $v->version_title,
                'version_description' => $v->version_description,
                'file_url' => $v->file_path ? asset('storage/' . $v->file_path) : null,
                'uploaded_by' => $v->user?->name,
                'created_at' => $v->created_at,
            ])
        ]);
    }

    // 2. ✅ دالة الرفع التي كانت مفقودة (upload)
    public function upload(Request $request, $projectId, ProjectVersionService $versionService)
    {
        $request->validate([
            'version_title' => 'required|string|max:255',
            'version_description' => 'nullable|string',
            'file' => 'required|file|max:20480', // الحد الأقصى 20 ميجا
        ]);

        $data = [
            'project_id' => $projectId,
            'version_title' => $request->version_title,
            'version_description' => $request->version_description,
        ];

        // توجيه العمل للسيرفيس
        $result = $versionService->uploadVersion($data, $request->file('file'), $request->user());

        return response()->json($result, $result['status'] ?? 200);
    }

    // 3. ✅ دالة التعديل (update)
    public function update(Request $request, $versionId)
    {
        $version = ProjectVersion::find($versionId);
        if (!$version) return response()->json(['message' => 'Version not found'], 404);

        $project = Project::find($version->project_id);
        if (!$this->canAccessProject($request, $project)) return response()->json(['message' => 'Unauthorized'], 403);

        $request->validate([
            'version_title' => 'required|string|max:255',
            'version_description' => 'nullable|string',
        ]);

        $version->update([
            'version_title' => $request->version_title,
            'version_description' => $request->version_description,
        ]);

        return response()->json([
            'message' => 'Version updated successfully',
            'version' => $version
        ]);
    }

    // 4. ✅ دالة الحذف (delete / destroy)
    public function destroy(Request $request, $versionId, ProjectVersionService $versionService)
    {
        $result = $versionService->deleteVersion($versionId, $request->user());
        return response()->json($result, $result['status'] ?? 200);
    }
    
    // دعم اسم الدالة delete في حال كان الـ Route لديك يستخدمها
    public function delete(Request $request, $versionId, ProjectVersionService $versionService)
    {
        return $this->destroy($request, $versionId, $versionService);
    }

    // 5. ✅ دالة التايم لاين (timeline)
    public function timeline(Request $request, $projectId, ProjectVersionService $versionService)
    {
        $result = $versionService->getTimeline($projectId, $request->user());
        return response()->json($result, $result['status'] ?? 200);
    }

    // 6. ✅ دالة الرفع إلى GitHub
    public function pushToGithub(Request $request, $id, ProjectVersionService $versionService)
    {
        // 1. تعريف المستخدم الحالي
        $user = $request->user();
    
        // 2. التحقق من وجود التوكن (الحماية)
        if (!$user->github_token) {
            return response()->json(['message' => 'يرجى ربط حسابك بـ GitHub أولاً.'], 403);
        }
    
        // 3. توجيه المهمة للسيرفيس (المسؤول عن التنفيذ الفعلي)
        // لاحظ أننا لم نعد بحاجة لكود Http هنا لأن السيرفيس يقوم بالواجب
        $result = $versionService->pushToGithub($id, $user);
    
        // 4. إرسال النتيجة النهائية للفرونت إند
        return response()->json($result, $result['status'] ?? 200);
    }
}