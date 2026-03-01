<?php

namespace App\Services\Mail;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Sends transactional emails via Resend's HTTPS API.
 * Used instead of SMTP because Railway blocks outbound SMTP ports.
 */
class ResendMailer
{
    protected string $apiKey;
    protected string $from;
    protected string $fromName;

    public function __construct()
    {
        $this->apiKey   = config('services.resend.api_key', '');
        // Resend requires a verified sender domain. Until a custom domain is
        // verified, use Resend's shared onboarding address for testing.
        $this->from     = 'onboarding@resend.dev';
        $this->fromName = config('mail.from.name', 'BarangayPGT');
    }

    /**
     * Send a plain HTML email via Resend API.
     *
     * @param  string  $to       Recipient email address
     * @param  string  $subject
     * @param  string  $html     HTML body
     * @return bool
     */
    public function send(string $to, string $subject, string $html): bool
    {
        try {
            $response = Http::timeout(15)
                ->withToken($this->apiKey)
                ->post('https://api.resend.com/emails', [
                    'from'    => "{$this->fromName} <{$this->from}>",
                    'to'      => [$to],
                    'subject' => $subject,
                    'html'    => $html,
                ]);

            if ($response->successful()) {
                return true;
            }

            Log::error('Resend API error', [
                'status' => $response->status(),
                'body'   => $response->body(),
                'to'     => $to,
            ]);
            return false;

        } catch (\Exception $e) {
            Log::error('ResendMailer exception', [
                'error' => $e->getMessage(),
                'to'    => $to,
            ]);
            return false;
        }
    }

    /**
     * Send the email verification link email.
     */
    public function sendVerificationLink(string $toEmail, string $toName, string $verificationUrl): bool
    {
        $subject = 'Verify Your Email – BarangayPGT';
        $html = "
            <div style='font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:8px;'>
                <h2 style='color:#1d4ed8;'>Verify Your Email Address</h2>
                <p>Hello, <strong>{$toName}</strong>!</p>
                <p>Please click the button below to verify your email address and activate your BarangayPGT account.</p>
                <p style='margin:32px 0;text-align:center;'>
                    <a href='{$verificationUrl}' style='background:#1d4ed8;color:#fff;padding:14px 28px;border-radius:6px;text-decoration:none;font-size:16px;font-weight:600;'>Verify Email</a>
                </p>
                <p style='color:#6b7280;font-size:13px;'>If the button does not work, copy and paste this link:<br/><a href='{$verificationUrl}'>{$verificationUrl}</a></p>
                <p style='color:#6b7280;font-size:13px;'>This link expires in 60 minutes. If you did not create an account, you can safely ignore this email.</p>
                <hr style='border:none;border-top:1px solid #e5e7eb;margin:24px 0;'/>
                <p style='color:#9ca3af;font-size:12px;'>Regards, BarangayPGT Team</p>
            </div>
        ";
        return $this->send($toEmail, $subject, $html);
    }

    /**
     * Send the device verification OTP email.
     */
    public function sendDeviceOtp(string $toEmail, string $toName, string $code): bool
    {
        $subject = 'Your Login Verification Code – BarangayPGT';
        $html = "
            <div style='font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:8px;'>
                <h2 style='color:#1d4ed8;'>New Device Login</h2>
                <p>Hello, <strong>{$toName}</strong>!</p>
                <p>A login attempt was made from a new device. Enter the code below to verify it's you:</p>
                <div style='font-size:36px;font-weight:700;letter-spacing:10px;text-align:center;margin:32px 0;color:#111827;'>{$code}</div>
                <p style='color:#6b7280;font-size:13px;'>This code expires in 15 minutes. If you did not attempt to log in, please change your password immediately.</p>
                <hr style='border:none;border-top:1px solid #e5e7eb;margin:24px 0;'/>
                <p style='color:#9ca3af;font-size:12px;'>Regards, BarangayPGT Team</p>
            </div>
        ";
        return $this->send($toEmail, $subject, $html);
    }
}
