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
     * تحديد إشعار واحد كـ "مقروء"
     */
    public function markAsRead(Request $request, $id)
    {
        // استدعاء السيرفيس لتحديث إشعار واحد فوراً وبدون تعقيد
        $this->service->markAsRead($request->user(), $id);
        
        return response()->json([
            'message' => 'تم تحديد الإشعار كمقروء'
        ]);
    }

    /**
     * تحديد كل الإشعارات كمقروءة
     */
    public function markAllAsRead(Request $request)
    {
        // استدعاء السيرفيس بدون تمرير ID لتحديث الكل
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