<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Laravel\Socialite\Facades\Socialite;
use App\Models\User;

class GitHubAuthController extends Controller
{
    


    
    // 1. إرسال المستخدم إلى شاشة الموافقة في GitHub
    public function redirect(Request $request)
    {
        /** @var \Laravel\Socialite\Two\GithubProvider $driver */
        $driver = Socialite::driver('github');

        return $driver
            ->scopes(['repo']) // 👈 هذا السطر هو الذي يعطي صلاحية الرفع!
            ->stateless()
            ->with(['state' => $request->user_id]) 
            ->redirect();
    }
    // 2. استقبال المستخدم والتوكن بعد عودته من GitHub
    public function callback(Request $request)
    {
        try {
            /** @var \Laravel\Socialite\Two\GithubProvider $driver */
            $driver = Socialite::driver('github');
            
            $githubUser = $driver->stateless()->user();
            $userId = $request->state; // استرجاع رقم المستخدم

            $user = User::find($userId);
            if ($user) {
                // حفظ التوكن في الداتا بيز
                $user->github_token = $githubUser->token;
                $user->save();
            }

            // توجيه الطالب بعد النجاح
            return redirect('http://localhost:5173/dashboard/projects?github=success'); 
            
        } catch (\Exception $e) {
            // توجيه الطالب في حال الفشل
            return redirect('http://localhost:5173/dashboard/projects?github=error');
        }
    }
    public function unlink(Request $request)
    {
        $user = $request->user();
        
        // حماية إضافية: إذا لم يتعرف عليه، يرجع خطأ بدل أن ينهار
        if (!$user) {
            return response()->json(['message' => 'غير مصرح لك بالقيام بهذا الإجراء'], 401);
        }

        $user->github_token = null;
        $user->save();

        return response()->json(['message' => 'تم إلغاء ربط حساب GitHub بنجاح']);
    }
}