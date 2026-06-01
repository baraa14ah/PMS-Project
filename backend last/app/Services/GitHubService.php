<?php

namespace App\Services;

use App\Models\Project;
use App\Models\GitCommit;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GithubService
{
    /**
     * جلب ومزامنة التحديثات من مستودع جيتهاب
     */
    public function syncProjectCommits(Project $project)
    {
        if (!$project->github_repo_url) {
            return ['status' => 422, 'message' => 'GitHub repo URL is missing'];
        }

        // تنظيف الرابط واستخراج اسم المستخدم والمستودع بطريقة آمنة
        $url = trim($project->github_repo_url, '/');
        $url = preg_replace('/\.git$/', '', $url);

        if (!preg_match('~github\.com/([^/]+)/([^/\?]+)~i', $url, $m)) {
            return [
                'status' => 422,
                'message' => 'Invalid GitHub repo URL',
                'details' => $project->github_repo_url
            ];
        }

        $owner = $m[1];
        $repo  = $m[2];

        // جلب التوكن من ملف .env
        $token = env('GITHUB_TOKEN');
        if (!$token) {
            return [
                'status' => 500,
                'message' => 'GITHUB_TOKEN is missing in .env file. Please add it.'
            ];
        }

        $apiUrl = "https://api.github.com/repos/{$owner}/{$repo}/commits?per_page=30";

        try {
            // الاتصال بـ GitHub
            $res = Http::withHeaders([
                'Accept' => 'application/vnd.github+json',
                'Authorization' => "Bearer {$token}",
                'X-GitHub-Api-Version' => '2022-11-28',
                'User-Agent' => 'Project-Management-System'
            ])->get($apiUrl);

            // معالجة الأخطاء القادمة من جيتهاب باحترافية
            if (!$res->successful()) {
                Log::error("GitHub API Failed for Project {$project->id}: " . $res->body());
                
                $errorMessage = $res->status() === 404 
                    ? 'Repository not found. Make sure the URL is correct and the Token has access to private repos.' 
                    : 'Failed to fetch commits from GitHub';

                return [
                    'status' => $res->status() === 404 ? 404 : 500,
                    'message' => $errorMessage,
                    'details' => $res->json()
                ];
            }

            $items = $res->json() ?? [];
            $saved = 0;

            // حفظ البيانات
            foreach ($items as $item) {
                $sha = $item['sha'] ?? null;
                if (!$sha) continue;

                GitCommit::updateOrCreate(
                    [
                        'project_id'  => $project->id,
                        'commit_hash' => $sha,
                    ],
                    [
                        'author_name'  => $item['commit']['author']['name'] ?? null,
                        'message'      => $item['commit']['message'] ?? null,
                        'committed_at' => $item['commit']['author']['date'] ?? null,
                        'url'          => $item['html_url'] ?? null,
                    ]
                );
                $saved++;
            }

            return [
                'status' => 200,
                'message' => 'Commits synced successfully',
                'count' => $saved
            ];

        } catch (\Throwable $e) {
            Log::error("GitHub Sync Exception: " . $e->getMessage());
            return [
                'status' => 500,
                'message' => 'Server error while syncing commits',
                'details' => $e->getMessage()
            ];
        }
    }
    /**
     * ✅ رفع إصدار (ملف محلي) إلى جيتهاب مباشرة كـ Commit جديد
     */
   /**
     * ✅ رفع إصدار (ملف محلي) إلى جيتهاب مباشرة كـ Commit جديد بأسماء نظيفة
     */
   /**
     * ✅ رفع إصدار إلى جيتهاب (داخل مجلد versions، والكوميت هو الوصف)
     */
    public function pushVersionToGithub($project, $title, $description, $filePath)
    {
        // 1. جلب المستخدم الحالي وتنظيف التوكن من أي مسافات مخفية (السر هنا!)
        $user = auth()->user();
        if (!$user || !$user->github_token) {
            return ['status' => 403, 'message' => 'يرجى ربط حسابك بـ GitHub أولاً.'];
        }
        $cleanToken = trim($user->github_token);

        // 2. استخراج مسار المستودع بذكاء
        $repoUrl = rtrim($project->github_repo_url, '/');
        $urlParts = explode('github.com/', $repoUrl);
        if (count($urlParts) < 2) {
            return ['status' => 400, 'message' => 'رابط المستودع غير صالح.'];
        }
        $repoPath = trim($urlParts[1]);

        // 3. جلب الملف من السيرفر وتحويله لتشفير Base64
        if (!\Illuminate\Support\Facades\Storage::disk('public')->exists($filePath)) {
            return ['status' => 404, 'message' => 'الملف غير موجود على السيرفر'];
        }
        $fileContent = \Illuminate\Support\Facades\Storage::disk('public')->get($filePath);
        $base64Content = base64_encode($fileContent);

        // 4. هندسة اسم الملف ورسالة الكوميت
        $extension = pathinfo($filePath, PATHINFO_EXTENSION);
        $safeVersionName = str_replace(' ', '_', $title);
        $fileName = rawurlencode($safeVersionName . '.' . $extension);

        // الوصف سيصبح هو رسالة الكوميت هنا
        $commitMessage = $description ? $description : "تحديث جديد للإصدار: {$title}";

        // 5. الاتصال الفعلي بـ GitHub
        $response = \Illuminate\Support\Facades\Http::withToken($cleanToken)
            ->withoutVerifying() // تخطي SSL في بيئة التطوير المحلية
            ->timeout(60)
            ->withHeaders([
                'User-Agent' => 'My-Graduation-Project',
                'Accept' => 'application/vnd.github.v3+json',
            ])
            ->put("https://api.github.com/repos/{$repoPath}/contents/versions/{$fileName}", [
                'message' => $commitMessage,
                'content' => $base64Content,
            ]);

        // 6. الردود
        if ($response->successful()) {
            return ['status' => 200, 'message' => 'تم الرفع إلى GitHub بنجاح! 🚀'];
        }

        $errorMsg = $response->json('message') ?? 'فشل الرفع لسبب غير معروف';
        return ['status' => $response->status(), 'message' => 'خطأ من GitHub: ' . $errorMsg];
    }
}