<?php

namespace App\Http\Controllers;

use App\Models\Project;
use Illuminate\Http\Request;
use App\Services\ProjectService;
use App\Services\GithubService;

class ProjectController extends Controller
{
    protected ProjectService $projectService;
    protected GithubService $githubService;

    public function __construct(ProjectService $projectService, GithubService $githubService)
    {
        $this->projectService = $projectService;
        $this->githubService = $githubService;
    }

    // 1. عرض جميع المشاريع
  // 1. عرض جميع المشاريع (تم برمجتها لتناسب جميع الصلاحيات مباشرة)
  public function index(Request $request)
  {
      $user = $request->user();
      $user->loadMissing('role');

      $projects = $this->projectService->listForIndex($user);

      return response()->json(['projects' => $projects]);
  }

    // 2. عرض تفاصيل مشروع محدد
    public function show(Request $request, $id)
    {
        $project = $this->projectService->getProjectFullDetails((int)$id);
        
        if (!$project) return response()->json(['message' => 'Project not found'], 404);

        // حساب التقدم ودمجه في الرد
        $stats = $this->projectService->calculateProgress((int)$id);

        return response()->json([
            'project' => $project,
            'stats' => $stats
        ]);
    }

    // 3. ✅ دالة الإنشاء المفقودة (Create)
    public function create(Request $request)
    {
        // السيرفيس يقوم بالتحقق (Validation) وإنشاء المشروع
        $project = $this->projectService->create($request);
        
        return response()->json([
            'message' => 'تم إنشاء المشروع بنجاح', 
            'project' => $project
        ], 201);
    }

    // 4. ✅ دالة التعديل المفقودة (Update)
    public function update(Request $request, $id)
    {
        $result = $this->projectService->update($request, (int)$id, $request->user());

        if ($result === 'unauthorized') {
            return response()->json(['message' => 'غير مصرح لك بتعديل هذا المشروع'], 403);
        }
        
        if (!$result) {
            return response()->json(['message' => 'المشروع غير موجود'], 404);
        }

        return response()->json([
            'message' => 'تم تعديل المشروع بنجاح', 
            'project' => $result
        ]);
    }

    // 5. ✅ دالة الحذف المفقودة (Delete)
    public function delete(Request $request, $id)
    {
        $result = $this->projectService->delete((int)$id, $request->user());

        if ($result === 'unauthorized') {
            return response()->json(['message' => 'غير مصرح لك بحذف هذا المشروع'], 403);
        }
        
        if (!$result) {
            return response()->json(['message' => 'المشروع غير موجود'], 404);
        }

        return response()->json(['message' => 'تم حذف المشروع بنجاح']);
    }

    // (دعم إضافي) في حال كان مسار الـ Route لديك يطلب دالة باسم destroy بدلاً من delete
    public function destroy(Request $request, $id)
    {
        return $this->delete($request, $id);
    }
    // دالة إلغاء الإشراف على المشروع
    public function leaveSupervision(Request $request, $id)
    {
        $project = \App\Models\Project::query()->whereKey($id)->firstOrFail();

        // التأكد من أن من يطلب الإلغاء هو مشرف المشروع نفسه
        $user = $request->user();

        if ($project->supervisor_id !== $user->id) {
            return response()->json(['message' => 'غير مصرح لك بإلغاء الإشراف'], 403);
        }

        // إزالة المشرف من المشروع
        $project->supervisor_id = null;
        $project->save();

        return response()->json(['message' => 'تم إلغاء الإشراف بنجاح']);
    }
    // ✅ دالة جلب نسبة التقدم (لحل خطأ 500)
    public function progress(Request $request, $id)
    {
        $stats = $this->projectService->calculateProgress((int)$id);
        if (!$stats) {
            return response()->json(['message' => 'المشروع غير موجود'], 404);
        }
        return response()->json($stats);
    }


  /**
     * عرض قائمة الطلاب المتاحين للدعوة
     */
    public function students(Request $request, int $id)
    {
        // استدعاء السيرفيس للقيام بالعمل الشاق
        $students = $this->projectService->getAvailableStudentsForInvite(
            $id,
            $request->get('search'),
        );

        return response()->json(['students' => $students]);
    }
    public function getActivities($id)
    {
        $project = \App\Models\Project::query()->whereKey($id)->first();
        if (!$project) {
            return response()->json(['message' => 'Project not found'], 404);
        }

        $activities = \App\Models\ProjectActivity::query()
            ->forCurrentUniversity()
            ->with('user:id,name')
            ->where('project_id', $id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'status' => 'success',
            'activities' => $activities,
        ]);
    }
}