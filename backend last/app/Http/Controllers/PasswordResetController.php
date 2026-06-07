<?php

namespace App\Http\Controllers;

use App\Mail\PasswordResetMail;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class PasswordResetController extends Controller
{
    private const EXPIRES_MINUTES = 60;

    private const SUCCESS_MESSAGE =
        'إذا كان هناك حساب نشط مرتبط بهذا البريد، ستصلك رسالة خلال دقائق تحتوي رابط إعادة التعيين.';

    /** Send a password reset link to the given email. */
    public function forgot(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        $email = strtolower(trim($request->email));
        $user = User::where('email', $email)->first();

        if ($user && $user->isActive()) {
            $plainToken = Str::random(64);

            DB::table('password_reset_tokens')->updateOrInsert(
                ['email' => $user->email],
                [
                    'token'      => Hash::make($plainToken),
                    'created_at' => now(),
                ],
            );

            $frontend = rtrim(config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:5173')), '/');
            $resetUrl = "{$frontend}/reset-password?email=" . urlencode($user->email) . "&token={$plainToken}";

            $this->sendResetEmail($user, $resetUrl);
        }

        return response()->json([
            'message' => self::SUCCESS_MESSAGE,
        ]);
    }

    /** Reset the user's password using a valid token. */
    public function reset(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'token'    => 'required|string',
            'password' => 'required|min:6|confirmed',
        ]);

        $row = DB::table('password_reset_tokens')->where('email', $request->email)->first();

        if (!$row || !Hash::check($request->token, $row->token)) {
            return response()->json([
                'message' => 'الرابط غير صالح أو منتهٍ الصلاحية. اطلب رابطاً جديداً من صفحة استعادة كلمة المرور.',
            ], 422);
        }

        $createdAt = Carbon::parse($row->created_at);
        if ($createdAt->diffInMinutes(now()) > self::EXPIRES_MINUTES) {
            DB::table('password_reset_tokens')->where('email', $request->email)->delete();

            return response()->json([
                'message' => 'انتهت صلاحية الرابط (60 دقيقة). اطلب رابطاً جديداً.',
            ], 422);
        }

        $user = User::where('email', $request->email)->first();
        if (!$user) {
            return response()->json(['message' => 'تعذر إتمام العملية.'], 404);
        }

        if (!$user->isActive()) {
            return response()->json([
                'message' => 'الحساب غير مفعّل. تواصل مع مسؤول جامعتك.',
            ], 422);
        }

        $user->password = $request->password;
        $user->save();

        DB::table('password_reset_tokens')->where('email', $request->email)->delete();
        DB::table('personal_access_tokens')->where('tokenable_id', $user->id)->delete();

        return response()->json([
            'message' => 'تم تحديث كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن.',
        ]);
    }

    /** Attempt to send the password reset email via configured mailers. */
    private function sendResetEmail(User $user, string $resetUrl): void
    {
        $mailable = new PasswordResetMail($user->name, $resetUrl, self::EXPIRES_MINUTES);

        $mailers = array_values(array_unique(array_filter([
            config('mail.default'),
            'smtp',
            'log',
        ])));

        foreach ($mailers as $mailer) {
            try {
                Mail::mailer($mailer)->to($user->email)->send($mailable);

                if ($mailer === 'log') {
                    Log::info('Password reset email written to log (MAIL_MAILER=log)', [
                        'email' => $user->email,
                    ]);
                }

                return;
            } catch (\Throwable $e) {
                Log::debug("Password reset mailer [{$mailer}] failed: {$e->getMessage()}");
            }
        }

        Log::error('Password reset: could not send email', [
            'email'    => $user->email,
            'reset_url' => $resetUrl,
            'hint'     => 'Configure MAIL_* in .env or use MAIL_MAILER=log',
        ]);
    }
}
