<?php

namespace App\Services\Mail;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Sends transactional emails via Brevo's HTTP REST API.
 * Used instead of SMTP because Railway blocks outbound SMTP ports.
 */
class BrevoApiMailer
{
    private const API_URL = 'https://api.brevo.com/v3/smtp/email';

    private string $apiKey;
    private array  $sender;

    public function __construct()
    {
        $this->apiKey = config('services.brevo.api_key');
        $this->sender = [
            'name'  => config('mail.from.name', 'BarangayPGT'),
            'email' => config('mail.from.address', 'martinitokristan@gmail.com'),
        ];
    }

    /**
     * Send a verification link email.
     */
    public function sendVerificationLink(string $toEmail, string $toName, string $verifyUrl): void
    {
        $html = '
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
            <h2 style="color:#1d4ed8;">Hello, ' . e($toName) . '!</h2>
            <p>Thank you for registering. Please click the button below to verify your email address and activate your account.</p>
            <div style="text-align:center;margin:32px 0;">
                <a href="' . $verifyUrl . '"
                   style="background:#1d4ed8;color:#fff;padding:14px 28px;border-radius:6px;text-decoration:none;font-size:16px;">
                    Verify Email
                </a>
            </div>
            <p style="color:#6b7280;font-size:14px;">This link will expire in 60 minutes.</p>
            <p style="color:#6b7280;font-size:14px;">If you did not create an account, no further action is required.</p>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
            <p style="color:#9ca3af;font-size:13px;">Regards, BarangayPGT</p>
        </div>';

        $this->send($toEmail, $toName, 'Verify Your Email - BarangayPGT', $html);
    }

    /**
     * Send a device OTP verification email.
     */
    public function sendDeviceOtp(string $toEmail, string $toName, string $code): void
    {
        $html = '
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
            <h2 style="color:#1d4ed8;">New Device Login - BarangayPGT</h2>
            <p>Hello, <strong>' . e($toName) . '</strong>!</p>
            <p>A login attempt was made from a new device. Use the code below to verify it\'s you:</p>
            <div style="text-align:center;margin:32px 0;font-size:36px;font-weight:bold;letter-spacing:8px;color:#1d4ed8;">
                ' . e($code) . '
            </div>
            <p style="color:#6b7280;font-size:14px;">This code will expire in 15 minutes.</p>
            <p style="color:#6b7280;font-size:14px;">If you did not attempt to log in, please change your password immediately.</p>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
            <p style="color:#9ca3af;font-size:13px;">Regards, BarangayPGT</p>
        </div>';

        $this->send($toEmail, $toName, 'Login Verification Code - BarangayPGT', $html);
    }

    /**
     * Send a registration OTP email (step 2 of the registration flow).
     */
    public function sendRegistrationOtp(string $toEmail, string $toName, string $code): void
    {
        $html = '
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
            <h2 style="color:#1d4ed8;">Complete Your Registration</h2>
            <p>Hello, <strong>' . e($toName) . '</strong>!</p>
            <p>You\'re almost there! Enter the code below to verify your email and create your BarangayPGT account.</p>
            <div style="text-align:center;margin:32px 0;font-size:40px;font-weight:bold;letter-spacing:10px;color:#1d4ed8;">
                ' . e($code) . '
            </div>
            <p style="color:#6b7280;font-size:14px;">This code will expire in <strong>15 minutes</strong>.</p>
            <p style="color:#6b7280;font-size:14px;">If you did not create an account, you can safely ignore this email.</p>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
            <p style="color:#9ca3af;font-size:13px;">Regards, BarangayPGT</p>
        </div>';

        $this->send($toEmail, $toName, 'Your BarangayPGT Verification Code', $html);
    }

    /**
     * Send a registration email-verification link (click-to-verify flow).
     * The link encodes the email + OTP so the user never has to type a code.
     */
    public function sendRegistrationLink(string $toEmail, string $toName, string $verifyUrl): void
    {
        $html = '
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
            <h2 style="color:#1d4ed8;">Welcome to BarangayPGT, ' . e($toName) . '!</h2>
            <p>Thank you for registering. Click the button below to verify your email address and complete your account setup.</p>
            <div style="text-align:center;margin:32px 0;">
                <a href="' . $verifyUrl . '"
                   style="background:#1d4ed8;color:#fff;padding:14px 32px;border-radius:6px;text-decoration:none;font-size:16px;font-weight:bold;">
                    Verify Email
                </a>
            </div>
            <p style="color:#6b7280;font-size:14px;">This link will expire in <strong>15 minutes</strong>.</p>
            <p style="color:#6b7280;font-size:14px;">If you did not create an account, you can safely ignore this email.</p>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
            <p style="color:#9ca3af;font-size:13px;">Regards, BarangayPGT</p>
        </div>';

        $this->send($toEmail, $toName, 'Verify Your Email – BarangayPGT', $html);
    }

    /**
     * Send a password reset link email.
     */
    public function sendPasswordReset(string $toEmail, string $toName, string $resetUrl): void
    {
        $html = '
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
            <h2 style="color:#1d4ed8;">Password Reset Request</h2>
            <p>Hello, <strong>' . e($toName) . '</strong>!</p>
            <p>We received a request to reset the password for your BarangayPGT account. Click the button below to choose a new password.</p>
            <div style="text-align:center;margin:32px 0;">
                <a href="' . $resetUrl . '"
                   style="background:#1d4ed8;color:#fff;padding:14px 28px;border-radius:6px;text-decoration:none;font-size:16px;">
                    Reset My Password
                </a>
            </div>
            <p style="color:#6b7280;font-size:14px;">This link will expire in 60 minutes.</p>
            <p style="color:#6b7280;font-size:14px;">If you did not request a password reset, you can safely ignore this email — your password will not be changed.</p>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
            <p style="color:#9ca3af;font-size:13px;">Regards, BarangayPGT</p>
        </div>';

        $this->send($toEmail, $toName, 'Password Reset Request – BarangayPGT', $html);
    }

    /**
     * Core send method via Brevo HTTP API.
     */
    private function send(string $toEmail, string $toName, string $subject, string $html): void
    {
        $response = Http::withHeaders([
            'api-key'      => $this->apiKey,
            'Content-Type' => 'application/json',
        ])->post(self::API_URL, [
            'sender'      => $this->sender,
            'to'          => [['email' => $toEmail, 'name' => $toName]],
            'subject'     => $subject,
            'htmlContent' => $html,
        ]);

        if (!$response->successful()) {
            Log::error('Brevo API mail failed', [
                'status' => $response->status(),
                'body'   => $response->body(),
                'to'     => $toEmail,
            ]);
            throw new \RuntimeException('Failed to send email via Brevo API: ' . $response->body());
        }
    }
}
