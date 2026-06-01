<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Http;
use App\Models\GitCommit;
use App\Models\Project;
class ProfileController extends Controller
{
  // عرض بروفايل المستخدم الحالي
  public function me(Request $request)
  {
    $user = $request->user();
    $user->load('profile');

    // لو ما عنده بروفايل ننشئه تلقائيًا
    if (!$user->profile) {
      $user->profile()->create([]);
      $user->load('profile');
    }

    return response()->json([
      'user' => $user,
      'profile' => $user->profile,
    ]);
  }

  // تحديث بروفايل المستخدم الحالي
  public function update(Request $request)
  {
    $user = $request->user();
    $role = $user->role?->name ?? $user->role; // حسب مشروعك

    $rules = [
      'phone' => 'nullable|string|max:50',
      'avatar' => 'nullable|string|max:255',
    ];

    // ✅ حقول الطالب فقط
    if (strtolower($role) === 'student') {
      $rules['university_name'] = 'nullable|string|max:255';
      $rules['student_number']  = 'nullable|string|max:50';
    }

    $v = Validator::make($request->all(), $rules);
    if ($v->fails()) {
      return response()->json(['errors' => $v->errors()], 422);
    }

    $user->load('profile');
    if (!$user->profile) $user->profile()->create([]);

    $data = $v->validated();

    // لو مو طالب لا نسمح يرسل حقول الطالب حتى لو حاول
    if (strtolower($role) !== 'student') {
      unset($data['university_name'], $data['student_number']);
    }

    $user->profile->update($data);

    return response()->json([
      'message' => 'Profile updated successfully',
      'profile' => $user->profile->fresh(),
    ]);
  }
  private function parseGithubRepo(string $url): ?array
{
    // يقبل:
    // https://github.com/owner/repo
    // https://github.com/owner/repo.git
    // owner/repo
    $url = trim($url);

    if (preg_match('~^https?://github\.com/([^/]+)/([^/]+?)(?:\.git)?/?$~', $url, $m)) {
        return ['owner' => $m[1], 'repo' => $m[2]];
    }

    if (preg_match('~^([^/]+)/([^/]+)$~', $url, $m)) {
        return ['owner' => $m[1], 'repo' => $m[2]];
    }

    return null;
}
public function commits($id, Request $request)
{
    $project = Project::findOrFail($id);

    // (اختياري) تحقق صلاحيات: فقط أعضاء المشروع/أدمن
    // إذا عندك منطق عضوية project_members طبّقه هنا

    $commits = GitCommit::where('project_id', $project->id)
        ->orderByDesc('committed_at')
        ->limit(100)
        ->get();

    return response()->json([
        'project_id' => $project->id,
        'count' => $commits->count(),
        'commits' => $commits,
    ]);
}

public function syncCommits($id, Request $request)
{
    $project = Project::findOrFail($id);

    if (!$project->github_repo_url) {
        return response()->json(['message' => 'لا يوجد رابط GitHub لهذا المشروع'], 422);
    }

    $parsed = $this->parseGithubRepo($project->github_repo_url);
    if (!$parsed) {
        return response()->json(['message' => 'رابط GitHub غير صالح'], 422);
    }

    $owner = $parsed['owner'];
    $repo  = $parsed['repo'];
    $branch = $project->github_branch ?: 'main';

    $token = config('services.github.token'); // من .env

    $url = "https://api.github.com/repos/{$owner}/{$repo}/commits";

    $res = Http::withHeaders([
        'Accept' => 'application/vnd.github+json',
        'User-Agent' => 'ByteHub',
    ])->when($token, fn($h) => $h->withToken($token))
      ->get($url, [
        'sha' => $branch,
        'per_page' => 50,
      ]);

    if (!$res->ok()) {
        return response()->json([
            'message' => 'فشل جلب Commits من GitHub',
            'status' => $res->status(),
            'details' => $res->json(),
        ], 500);
    }

    $items = $res->json() ?? [];
    if (!is_array($items)) $items = [];

    $insertedOrUpdated = 0;

    foreach ($items as $item) {
        $sha = $item['sha'] ?? null;
        if (!$sha) continue;

        $commit = $item['commit'] ?? [];
        $author = $commit['author'] ?? null; // أحيانًا null
        $authorName = $author['name'] ?? ($item['author']['login'] ?? 'Unknown');
        $authorEmail = $author['email'] ?? null;

        $message = $commit['message'] ?? '';
        $committedAt = $author['date'] ?? null;

        $htmlUrl = $item['html_url'] ?? null;

        // upsert-like: منع تكرار commit_hash لنفس المشروع
        $row = GitCommit::updateOrCreate(
            ['project_id' => $project->id, 'commit_hash' => $sha],
            [
                'author_name' => $authorName,
                'author_email' => $authorEmail,
                'message' => $message,
                'committed_at' => $committedAt,
                'url' => $htmlUrl,
            ]
        );

        // للتقريب: كل مرة ينفذ updateOrCreate بنعتبره processed
        $insertedOrUpdated++;
    }

    $project->github_last_synced_at = now();
    $project->save();

    return response()->json([
        'message' => '✅ تم مزامنة الـ Commits بنجاح',
        'project_id' => $project->id,
        'processed' => $insertedOrUpdated,
        'branch' => $branch,
        'last_synced_at' => $project->github_last_synced_at,
    ]);
}


}
