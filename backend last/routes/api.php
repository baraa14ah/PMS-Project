<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ProjectVersionController;
use App\Http\Controllers\SupervisorInvitationController;
use App\Http\Controllers\StudentInvitationController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\GitHubAuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\UniversityController;
use App\Http\Controllers\PlatformAdminController;
use App\Http\Controllers\PasswordResetHelpController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\AIIdeationController;
use App\Http\Controllers\AITaskController;

/*
|--------------------------------------------------------------------------
| Public Auth Routes
|--------------------------------------------------------------------------
*/
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::middleware('throttle:6,1')->group(function () {
    Route::post('/password/request-help', [PasswordResetHelpController::class, 'requestHelp']);
});

Route::get('/auth/github/callback', [GitHubAuthController::class, 'callback']);
Route::get('/auth/github/redirect', [GitHubAuthController::class, 'redirect']);

Route::get('/universities', [UniversityController::class, 'publicList']);

/*
|--------------------------------------------------------------------------
| Protected Routes (Sanctum)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum', \App\Http\Middleware\EnsureUserHasUniversity::class])->group(function () {

    /*
    |--------------------------------------------------------------------------
    | Group A: Allowlist (No status check)
    |--------------------------------------------------------------------------
    | These routes are accessible even if the user is pending or rejected.
    */
    Route::get('/profile', [AuthController::class, 'profile']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/profile/me', [ProfileController::class, 'me']);
    Route::get('/user', function (Request $request) {
        return response()->json($request->user());
    });

    /*
    |--------------------------------------------------------------------------
    | Group B: Protected (Requires active status)
    |--------------------------------------------------------------------------
    */
    Route::middleware(['user.status'])->group(function () {

        /*
        |--------------------------------------------------------------------------
        | Auth & Profile (Write operations)
        |--------------------------------------------------------------------------
        */
        Route::put('/profile/update', [AuthController::class, 'updateProfile']);
        Route::put('/profile/change-password', [AuthController::class, 'changePassword']);

        Route::get('/dashboard/summary', [DashboardController::class, 'summary']);
        Route::get('/dashboard/badges', [DashboardController::class, 'badges']);
        Route::put('/profile/me', [ProfileController::class, 'update']);
        Route::put('/profile/supervisor-availability', [ProfileController::class, 'updateSupervisorAvailability']);
        Route::post('/profile/unlink-github', [GitHubAuthController::class, 'unlink']);

        /*
        |--------------------------------------------------------------------------
        | Users & Admin Approval
        |--------------------------------------------------------------------------
        */
        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::put('/users/{id}', [UserController::class, 'update']);
        Route::delete('/users/{id}', [UserController::class, 'destroy'])->middleware('role:admin');

        // New Admin Approval Routes
        Route::middleware(['role:admin'])->group(function () {
            Route::get('/users/pending', [UserController::class, 'pending']);
            Route::post('/users/{id}/approve', [UserController::class, 'approve']);
            Route::post('/users/{id}/reject', [UserController::class, 'reject']);

            Route::get('/password-reset-requests', [PasswordResetHelpController::class, 'index']);
            Route::post('/password-reset-requests/{id}/temporary-password', [PasswordResetHelpController::class, 'temporaryPassword']);
            Route::post('/password-reset-requests/{id}/dismiss', [PasswordResetHelpController::class, 'dismiss']);
        });

        Route::middleware(['role:super_admin'])->group(function () {
            Route::get('/admin/universities', [UniversityController::class, 'index']);
            Route::post('/admin/universities', [UniversityController::class, 'store']);
            Route::put('/admin/universities/{id}', [UniversityController::class, 'update']);

            Route::get('/admin/dashboard/stats', [PlatformAdminController::class, 'dashboardStats']);
            Route::get('/admin/users', [PlatformAdminController::class, 'indexUsers']);
            Route::post('/admin/users', [PlatformAdminController::class, 'storeUser']);
            Route::put('/admin/users/{id}', [PlatformAdminController::class, 'updateUser']);
            Route::delete('/admin/users/{id}', [PlatformAdminController::class, 'destroyUser']);

            Route::get('/admin/projects', [PlatformAdminController::class, 'indexProjects']);
            Route::put('/admin/projects/{id}', [PlatformAdminController::class, 'updateProject']);
            Route::delete('/admin/projects/{id}', [PlatformAdminController::class, 'destroyProject']);
        });

        /*
        |--------------------------------------------------------------------------
        | Projects
        |--------------------------------------------------------------------------
        */
        Route::post('/project/create', [ProjectController::class, 'create'])
            ->middleware('role:admin,student');

        Route::get('/projects', [ProjectController::class, 'index']);
        Route::get('/project/{id}', [ProjectController::class, 'show']);
        Route::put('/project/update/{id}', [ProjectController::class, 'update']);
        Route::delete('/project/delete/{id}', [ProjectController::class, 'delete']);

        Route::get('/project/{id}/progress', [ProjectController::class, 'progress']);
        Route::post('/project/{id}/sync-commits', [ProjectController::class, 'syncCommits']);
        Route::get('/project/{id}/commits', [ProjectController::class, 'commits']);
        Route::get('/project/{id}/students', [ProjectController::class, 'students']);
        Route::get('/project/{id}/activities', [ProjectController::class, 'getActivities']);
        Route::post('/project/{projectId}/leave-supervision', [ProjectController::class, 'leaveSupervision']);

        /*
        |--------------------------------------------------------------------------
        | Tasks
        |--------------------------------------------------------------------------
        */
        Route::post('/task/create', [TaskController::class, 'create']);
        Route::get('/project/{id}/tasks', [TaskController::class, 'getProjectTasks']);
        Route::put('/task/update/{id}', [TaskController::class, 'update']);
        Route::delete('/task/delete/{id}', [TaskController::class, 'delete']);

        /*
        |--------------------------------------------------------------------------
        | Comments
        |--------------------------------------------------------------------------
        */
        Route::post('/project/{id}/comment', [CommentController::class, 'storeProjectComment']);
        Route::get('/project/{id}/comments', [CommentController::class, 'projectComments']);
        Route::post('/task/{id}/comment', [CommentController::class, 'storeTaskComment']);
        Route::get('/task/{id}/comments', [CommentController::class, 'taskComments']);
        Route::put('/comment/{id}', [CommentController::class, 'update']);
        Route::delete('/comment/{id}', [CommentController::class, 'delete']);

        /*
        |--------------------------------------------------------------------------
        | Project Versions
        |--------------------------------------------------------------------------
        */
        Route::post('/project/{id}/versions/upload', [ProjectVersionController::class, 'upload']);
        Route::get('/project/{id}/versions', [ProjectVersionController::class, 'index']);
        Route::get('/project/{id}/versions/timeline', [ProjectVersionController::class, 'timeline']);
        Route::get('/project/{projectId}/versions/{versionId}', [ProjectVersionController::class, 'show']);
        Route::put('/project/versions/{versionId}', [ProjectVersionController::class, 'update']);
        Route::delete('/project/versions/{versionId}', [ProjectVersionController::class, 'delete']);
        Route::post('/project-versions/{versionId}/push-to-github', [ProjectVersionController::class, 'pushToGithub']);

        /*
        |--------------------------------------------------------------------------
        | Notifications
        |--------------------------------------------------------------------------
        */
        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::get('/notifications/unread', [NotificationController::class, 'unread']);
        Route::post('/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead']);
        Route::post('/notifications/{id}/mark-read', [NotificationController::class, 'markAsRead']);
        Route::delete('/notifications/delete-all', [NotificationController::class, 'deleteAll']);
        Route::delete('/notifications/{id}', [NotificationController::class, 'delete']);

        /*
        |--------------------------------------------------------------------------
        | Invitations
        |--------------------------------------------------------------------------
        */
        Route::get('/supervisors', [SupervisorInvitationController::class, 'supervisorsList']);
        Route::post('/project/{projectId}/invite-supervisor', [SupervisorInvitationController::class, 'inviteSupervisor']);
        Route::get('/supervisor/invitations', [SupervisorInvitationController::class, 'myInvitations']);
        Route::post('/supervisor/invitations/{inviteId}/accept', [SupervisorInvitationController::class, 'accept']);
        Route::post('/supervisor/invitations/{inviteId}/reject', [SupervisorInvitationController::class, 'reject']);

        Route::get('/students', [StudentInvitationController::class, 'studentsList']);
        Route::post('/project/{id}/invite-student', [StudentInvitationController::class, 'invite']);
        Route::get('/student/invitations', [StudentInvitationController::class, 'myInvitations']);
        Route::post('/student/invitations/{inviteId}/accept', [StudentInvitationController::class, 'accept']);
        Route::post('/student/invitations/{inviteId}/reject', [StudentInvitationController::class, 'reject']);

        /*
        |--------------------------------------------------------------------------
        | AI Project Ideation (Students only)
        |--------------------------------------------------------------------------
        */
        Route::middleware(['role:student'])->prefix('ai')->group(function () {
            Route::post('/suggest-projects', [AIIdeationController::class, 'suggest'])
                ->middleware('throttle:ai-ideation');
            Route::post('/bookmarks', [AIIdeationController::class, 'storeBookmark']);
            Route::get('/bookmarks', [AIIdeationController::class, 'listBookmarks']);
            Route::delete('/bookmarks/{id}', [AIIdeationController::class, 'deleteBookmark']);
        });

        Route::middleware(['role:student', 'throttle:ai-tasks'])
            ->post('/projects/{project}/generate-tasks', [AITaskController::class, 'generate']);
    });
});
