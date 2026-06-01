<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\NotificationService;

class NotificationController extends Controller
{
    protected NotificationService $service;

    public function __construct(NotificationService $service)
    {
        $this->service = $service;
    }

    /**
     * قائمة الإشعارات
     */
    public function index(Request $request)
    {
        $result = $this->service->getAll($request->user());
        return response()->json($result);
    }

    /**
     * تحديد إشعار كـ "مقروء" أو الكل
     */
    public function markAsRead(Request $request, $id)
    {
        // نبحث عن الإشعار غير المقروء الذي يخص هذا المستخدم ونحدثه
        $notification = $request->user()->unreadNotifications()->where('id', $id)->first();
        
        if ($notification) {
            $notification->markAsRead(); // هذه دالة جاهزة في لارافيل تغير read_at
        }

        return response()->json([
            'message' => 'تم تحديد الإشعار كمقروء'
        ]);
    }
/**
     * تحديد كل الإشعارات كمقروءة
     */
    public function markAllAsRead(Request $request)
    {
        // نستدعي دالة السيرفيس ونمرر لها المستخدم فقط (بدون ID)
        $result = $this->service->markAsRead($request->user());
        
        return response()->json([
            'message' => 'All notifications marked as read successfully',
            'unread_count' => $result['unread_count']
        ]);
    }
   
    public function delete(Request $request, $id)
    {
        $notification = $request->user()->notifications()->where('id', $id)->first();
        if (!$notification) return response()->json(['message' => 'Not found'], 404);

        $notification->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }
   
    public function deleteAll(Request $request)
    {
      
        $request->user()->notifications()->delete();
        
        return response()->json([
            'message' => 'All notifications deleted successfully'
        ]);
    }
}