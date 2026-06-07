<?php

namespace App\Repositories;

use Illuminate\Notifications\DatabaseNotification;

class NotificationRepository
{
    /** Get all notifications for the given user. */
    public function getAll($userId)
    {
        return DatabaseNotification::query()
            ->where('notifiable_id', $userId)
            ->where('notifiable_type', \App\Models\User::class)
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /** Get unread notifications for the given user. */
    public function getUnread($userId)
    {
        return DatabaseNotification::query()
            ->where('notifiable_id', $userId)
            ->where('notifiable_type', \App\Models\User::class)
            ->whereNull('read_at')
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /** Mark a single notification as read for the given user. */
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

    /** Mark all unread notifications as read for the given user. */
    public function markAllAsRead($userId)
    {
        return DatabaseNotification::query()
            ->where('notifiable_id', $userId)
            ->where('notifiable_type', \App\Models\User::class)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);
    }

    /** Delete a single notification for the given user. */
    public function delete($notificationId, $userId)
    {
        return DatabaseNotification::query()
            ->where('id', $notificationId)
            ->where('notifiable_id', $userId)
            ->where('notifiable_type', \App\Models\User::class)
            ->delete();
    }

    /** Delete all notifications for the given user. */
    public function deleteAll($userId)
    {
        return DatabaseNotification::query()
            ->where('notifiable_id', $userId)
            ->where('notifiable_type', \App\Models\User::class)
            ->delete();
    }
}
