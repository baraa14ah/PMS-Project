<?php

namespace App\Repositories;

use Illuminate\Notifications\DatabaseNotification;

class NotificationRepository
{
    public function getAll($userId)
    {
        return DatabaseNotification::where('notifiable_id', $userId)
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function getUnread($userId)
    {
        return DatabaseNotification::where('notifiable_id', $userId)
            ->whereNull('read_at')
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function markAsRead($notificationId, $userId)
    {
        $notification = DatabaseNotification::where('id', $notificationId)
            ->where('notifiable_id', $userId)
            ->first();

        if (!$notification) return null;

        $notification->markAsRead();
        return $notification;
    }

    public function markAllAsRead($userId)
    {
        return DatabaseNotification::where('notifiable_id', $userId)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);
    }

    public function delete($notificationId, $userId)
    {
        return DatabaseNotification::where('id', $notificationId)
            ->where('notifiable_id', $userId)
            ->delete();
    }

    public function deleteAll($userId)
    {
        return DatabaseNotification::where('notifiable_id', $userId)
            ->delete();
    }
}
