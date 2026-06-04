<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>إعادة تعيين كلمة المرور</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Tahoma,Arial,sans-serif;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr>
        <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
                <tr>
                    <td style="background:#111827;padding:28px 32px;">
                        <p style="margin:0;color:#9ca3af;font-size:13px;letter-spacing:0.5px;">ByteHub · PMS</p>
                        <h1 style="margin:8px 0 0;color:#ffffff;font-size:22px;font-weight:700;">إعادة تعيين كلمة المرور</h1>
                    </td>
                </tr>
                <tr>
                    <td style="padding:32px;">
                        <p style="margin:0 0 16px;color:#111827;font-size:16px;font-weight:600;">مرحباً {{ $userName }}،</p>
                        <p style="margin:0 0 24px;color:#4b5563;font-size:15px;line-height:1.7;">
                            تلقّينا طلباً لإعادة تعيين كلمة المرور لحسابك. اضغط الزر أدناه لاختيار كلمة مرور جديدة.
                        </p>
                        <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 28px;">
                            <tr>
                                <td style="border-radius:10px;background:#111827;">
                                    <a href="{{ $resetUrl }}"
                                       style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;">
                                        تعيين كلمة مرور جديدة
                                    </a>
                                </td>
                            </tr>
                        </table>
                        <p style="margin:0 0 12px;color:#6b7280;font-size:14px;line-height:1.6;">
                            ⏱ الرابط صالح لمدة <strong>{{ $expiresMinutes }} دقيقة</strong> ويُستخدم مرة واحدة.
                        </p>
                        <p style="margin:0;color:#9ca3af;font-size:13px;line-height:1.6;">
                            إن لم تطلب إعادة التعيين، يمكنك تجاهل هذه الرسالة بأمان ولن يتغيّر حسابك.
                        </p>
                    </td>
                </tr>
                <tr>
                    <td style="padding:20px 32px 28px;background:#f9fafb;border-top:1px solid #e5e7eb;">
                        <p style="margin:0 0 8px;color:#9ca3af;font-size:12px;">إذا لم يعمل الزر، انسخ الرابط التالي إلى المتصفح:</p>
                        <p style="margin:0;color:#6b7280;font-size:11px;word-break:break-all;line-height:1.5;">{{ $resetUrl }}</p>
                    </td>
                </tr>
            </table>
            <p style="margin:16px 0 0;color:#9ca3af;font-size:12px;">© {{ date('Y') }} ByteHub — نظام إدارة المشاريع الجامعية</p>
        </td>
    </tr>
</table>
</body>
</html>
