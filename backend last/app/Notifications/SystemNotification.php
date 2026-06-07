<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class SystemNotification extends Notification
{
    use Queueable;

    protected string $type;
    protected string $title;
    protected string $body;
    protected array $data;

    /** Create a system notification with type, title, body, and optional data. */
    public function __construct(
        string $type,
        string $title,
        string $body,
        array $data = []
    ) {
        $this->type  = $type;
        $this->title = $title;
        $this->body  = $body;
        $this->data  = $data;
    }

    /** Specify the notification delivery channels. */
    public function via($notifiable): array
    {
        return ['database'];
    }

    /** Build the array payload stored in the notifications table. */
    public function toDatabase($notifiable): array
    {
        $url = $this->data['url'] 
            ?? ($this->data['data']['url'] ?? null);

        return [
            'type'  => $this->type,
            'title' => $this->title,
            'body'  => $this->body,
            'data'  => array_merge(
                $this->data,
                $url ? ['url' => $url] : []
            ),
        ];
    }
}
