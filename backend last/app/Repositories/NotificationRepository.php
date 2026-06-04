<?php

namespace App\Repositories;

use Illuminate\Notifications\DatabaseNotification;

class NotificationRepository
{
    public function getAll($userId)
    {
        return DatabaseNotification::query()
            ->where('notifiable_id', $userId)
            ->where('notifiable_type', \App\Models\User::class)
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function getUnread($userId)
    {
        return DatabaseNotification::query()
            ->where('notifiable_id', $userId)
            ->where('notifiable_type', \App\Models\User::class)
            ->whereNull('read_at')
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function markAsRead($notificationId, $userId)
    {
        $notification = DatabaseNotification::query()
            ->where('id', $notificationId)
            ->where('notifiable_id', $userId)
            ->where('notifiable_type', \App\Models\User::class)
            ->first();

        if (!$notification) return null;

        $notification->markAsRead();
        return $notification;
    }

    public function markAllAsRead($userId)
    {
        return DatabaseNotification::query()
            ->where('notifiable_id', $userId)
            ->where('notifiable_type', \App\Models\User::class)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);
    }

    public function delete($notificationId, $userId)
    {
        return DatabaseNotification::query()
            ->where('id', $notificationId)
            ->where('notifiable_id', $userId)
            ->where('notifiable_type', \App\Models\User::class)
            ->delete();
    }

    public function deleteAll($userId)
    {
        return DatabaseNotification::query()
            ->where('notifiable_id', $userId)
            ->where('notifiable_type', \App\Models\User::class)
            ->delete();
    }
}
