<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\RatingController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ProjectVersionController;
use App\Http\Controllers\SupervisorInvitationController;
use App\Http\Controllers\StudentInvitationController;
use App\Http\Controllers\StudentDirectoryController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\GitHubAuthController;

/*
|--------------------------------------------------------------------------
| Public Auth Routes
|--------------------------------------------------------------------------
*/
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);


    Route::get('/auth/github/callback', [GitHubAuthController::class, 'callback']);
    Route::get('/auth/github/redirect', [GitHubAuthController::class, 'redirect']);
    
/*
|--------------------------------------------------------------------------
| Protected Routes (Sanctum)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum'])->group(function () {

    /*
    |--------------------------------------------------------------------------
    | Auth
    |--------------------------------------------------------------------------
    */
    Route::get('/profile', [AuthController::class, 'profile']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::put('/profile/update', [AuthController::class, 'updateProfile']);
    Route::put('/profile/change-password', [AuthController::class, 'changePassword']);

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
    /*
    |--------------------------------------------------------------------------
    | Tasks (أي مستخدم مسجّل دخول)
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
    | Debug
    |--------------------------------------------------------------------------
    */
    Route::get('/user', function (Request $request) {
        return response()->json($request->user());
    });
 

   
// ====== supervisors list (للطالب يجيب المشرفين) ======
Route::get('/supervisors', [SupervisorInvitationController::class, 'supervisorsList']);

// ====== invite supervisor from a project (الطالب يرسل دعوة) ======
Route::post('/project/{projectId}/invite-supervisor', [SupervisorInvitationController::class, 'inviteSupervisor']);

// ====== supervisor invitations (المشرف يشوف دعواته) ======
Route::get('/supervisor/invitations', [SupervisorInvitationController::class, 'myInvitations']);
Route::post('/supervisor/invitations/{inviteId}/accept', [SupervisorInvitationController::class, 'accept']);
Route::post('/supervisor/invitations/{inviteId}/reject', [SupervisorInvitationController::class, 'reject']);
Route::post('/project/{projectId}/leave-supervision', [ProjectController::class, 'leaveSupervision']);







Route::get('/students', [StudentInvitationController::class, 'studentsList']);
 // إرسال دعوة لطالب (من داخل ProjectDetails)
 Route::post('/project/{id}/invite-student', [StudentInvitationController::class, 'invite']);

 // صفحة الطالب لعرض الدعوات
 Route::get('/student/invitations', [StudentInvitationController::class, 'myInvitations']);


 // قبول/رفض
 Route::post('/student/invitations/{inviteId}/accept', [StudentInvitationController::class, 'accept']);
 Route::post('/student/invitations/{inviteId}/reject', [StudentInvitationController::class, 'reject']);
    //profile
 Route::get('/profile/me', [ProfileController::class, 'me']);
 Route::put('/profile/me', [ProfileController::class, 'update']);
 Route::post('/profile/unlink-github', [GitHubAuthController::class, 'unlink']);
});
