<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Laravel\Socialite\Facades\Socialite;

class GitHubAuthController extends Controller
{
    public function redirect(Request $request)
    {
        $request->validate([
            'user_id' => 'required|integer',
        ]);

        $user = User::query()->whereKey($request->user_id)->first();

        if (!$user) {
            return redirect($this->frontendRedirect('error', 'user_not_found'));
        }

        if (!$user->isActive()) {
            $reason = $user->isPending() ? 'pending' : 'rejected';
            return redirect($this->frontendRedirect('error', $reason));
        }

        /** @var \Laravel\Socialite\Two\GithubProvider $driver */
        $driver = Socialite::driver('github');

        return $driver
            ->scopes(['repo'])
            ->stateless()
            ->with(['state' => (string) $user->id])
            ->redirect();
    }

    public function callback(Request $request)
    {
        try {
            /** @var \Laravel\Socialite\Two\GithubProvider $driver */
            $driver = Socialite::driver('github');

            $githubUser = $driver->stateless()->user();
            $userId = $request->state;

            $user = User::query()->whereKey($userId)->first();

            if (!$user) {
                return redirect($this->frontendRedirect('error', 'user_not_found'));
            }

            if (!$user->isActive()) {
                $reason = $user->isPending() ? 'pending' : 'rejected';
                return redirect($this->frontendRedirect('error', $reason));
            }

            $user->github_token = $githubUser->token;
            $user->save();

            return redirect($this->frontendRedirect('success'));
        } catch (\Exception $e) {
            return redirect($this->frontendRedirect('error'));
        }
    }

    public function unlink(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'غير مصرح لك بالقيام بهذا الإجراء'], 401);
        }

        if (!$user->isActive()) {
            return response()->json([
                'message' => 'Account is not active.',
                'status' => $user->status,
            ], 403);
        }

        $user->github_token = null;
        $user->save();

        return response()->json(['message' => 'تم إلغاء ربط حساب GitHub بنجاح']);
    }

    private function frontendRedirect(string $result, ?string $reason = null): string
    {
        $base = rtrim(env('FRONTEND_URL', 'http://localhost:5173'), '/');
        $query = 'github=' . $result;

        if ($reason !== null) {
            $query .= '&reason=' . $reason;
        }

        return $base . '/dashboard/projects?' . $query;
    }
}
