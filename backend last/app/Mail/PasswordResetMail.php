<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PasswordResetMail extends Mailable
{
    use Queueable, SerializesModels;

    /** Build the password reset mailable with user details and reset URL. */
    public function __construct(
        public string $userName,
        public string $resetUrl,
        public int $expiresMinutes = 60,
    ) {}

    /** Define the email envelope including subject. */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'إعادة تعيين كلمة المرور — PMS',
        );
    }

    /** Define the email content view. */
    public function content(): Content
    {
        return new Content(
            view: 'emails.password-reset',
        );
    }
}
