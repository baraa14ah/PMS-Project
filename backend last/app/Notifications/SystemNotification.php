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

    /**
     * باني الإشعار: يستقبل النوع، العنوان، النص، وبيانات إضافية مثل الروابط
     */
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

    /**
     * نحدد القناة كقاعدة بيانات (Database) ليظهر في لوحة التحكم
     */
    public function via($notifiable): array
    {
        return ['database'];
    }

    /**
     * هيكلة البيانات التي سيتم تخزينها في جدول notifications
     * قمنا بإضافة حل لجعل الرابط (url) متاحاً دائماً في المستوى الأعلى للسهولة
     */
    public function toDatabase($notifiable): array
    {
        // استخراج الرابط إذا كان موجوداً لتسهيل الوصول إليه من الفرونت إند
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