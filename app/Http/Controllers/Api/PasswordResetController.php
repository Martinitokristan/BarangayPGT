<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Notifications\PasswordResetNotification;
use App\Services\Sms\SmsSender;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class PasswordResetController extends Controller
{
    /**
     * Send a password reset link via email or SMS.
     *
     * Rate-limited to 3 requests per 60 minutes (throttle:3,60 applied at
     * the route level). Returns the same generic response regardless of
     * whether the account exists, to prevent user enumeration.
     */
    public function forgotPassword(Request $request)
    {
        $request->validate([
            'method'     => 'required|in:email,phone',
            'identifier' => 'required|string|max:255',
        ]);

        $method     = $request->method;
        $identifier = trim($request->identifier);

        // Look up by email or phone number
        $user = $method === 'email'
            ? User::where('email', $identifier)->first()
            : User::where('phone', $identifier)->first();

        // Generic response to prevent user-enumeration attacks
        $genericResponse = response()->json([
            'message' => 'If an account with that information exists, a password reset link has been sent.',
        ]);

        if (!$user) {
            return $genericResponse;
        }

        // Purge any old tokens for this user, then generate a fresh one
        DB::table('password_resets')->where('email', $user->email)->delete();

        if ($method === 'email') {
            // ── EMAIL FLOW ────────────────────────────────────────────────
            // Send a signed URL link (60-minute expiry). Email clients
            // handle long URLs without any filtering issues.
            $plainToken  = Str::random(64);
            $hashedToken = hash('sha256', $plainToken);
            $expiresAt   = Carbon::now()->addMinutes(60);

            DB::table('password_resets')->insert([
                'email'      => $user->email,
                'token'      => $hashedToken,
                'created_at' => $expiresAt,  // store expiry time in created_at
            ]);

            $resetUrl = rtrim(config('app.url'), '/') . '/reset-password'
                . '?token=' . $plainToken
                . '&email=' . urlencode($user->email);

            $user->notify(new PasswordResetNotification($resetUrl));

        } else {
            // ── PHONE / SMS FLOW ──────────────────────────────────────────
            // Send a SHORT 6-digit OTP only — NO URL in the SMS.
            // Sending long URLs via SMS triggers IPROG phishing detection
            // (non_https_link, suspicious_url, credential_ask flags).
            // The OTP is hashed and stored identically to a URL token;
            // the same /reset-password endpoint validates both.
            $otp         = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
            $hashedToken = hash('sha256', $otp);
            $expiresAt   = Carbon::now()->addMinutes(15); // OTPs expire faster

            DB::table('password_resets')->insert([
                'email'      => $user->email,
                'token'      => $hashedToken,
                'created_at' => $expiresAt,
            ]);

            $sms     = new SmsSender();
            // Keep the message short and neutral — no URLs, no "password reset"
            // phrasing — to pass all IPROG SMS content filters.
            $message = "Barangay PGT code: {$otp}. Valid for 15 minutes. Do not share this code.";
            $result  = $sms->send($user->phone, $message);

            // Log but do not expose delivery failures to the caller
            // (prevents confirming which phone numbers exist in the system)
            if (!$result['success']) {
                \Log::error('Password reset SMS failed', [
                    'user_id' => $user->id,
                    'error'   => $result['error'] ?? 'unknown',
                ]);
            }
        }

        return $genericResponse;
    }

    /**
     * Validate a reset token and update the user's password.
     *
     * On success, all existing tokens are revoked and a fresh Sanctum token
     * is returned so the user is immediately logged in.
     *
     * Rate-limited to 3 requests per 60 minutes (throttle:3,60 applied at
     * the route level).
     */
    public function resetPassword(Request $request)
    {
        $request->validate([
            'token'                 => 'required|string',
            // Accept either email (link flow) or phone (OTP flow)
            'email'                 => 'required_without:phone|nullable|email',
            'phone'                 => 'required_without:email|nullable|string|max:20',
            'device_token'          => 'nullable|string|max:64',
            'password'              => 'required|string|min:8|confirmed',
        ]);

        // Resolve the user — by email (link flow) or by phone (OTP flow)
        if ($request->filled('email')) {
            $lookupEmail = $request->email;
            $user        = User::where('email', $lookupEmail)->first();
        } else {
            $user        = User::where('phone', $request->phone)->first();
            $lookupEmail = $user ? $user->email : null;
        }

        if (!$user || !$lookupEmail) {
            return response()->json(['message' => 'Invalid or expired code. Please request a new one.'], 422);
        }

        $hashedToken = hash('sha256', $request->token);

        $record = DB::table('password_resets')
            ->where('email', $lookupEmail)
            ->where('token', $hashedToken)
            ->first();

        if (!$record) {
            return response()->json(['message' => 'Invalid or expired code. Please request a new one.'], 422);
        }

        // created_at stores the expiry timestamp (set at token-generation time).
        // Email tokens expire after 60 min, SMS OTPs after 15 min.
        if (Carbon::parse($record->created_at)->isPast()) {
            DB::table('password_resets')->where('email', $lookupEmail)->delete();
            return response()->json(['message' => 'This code or link has expired. Please request a new one.'], 422);
        }

        // Update the password.
        // Also mark email as verified — completing a password reset via email
        // link or SMS OTP proves the user controls the account, so there is no
        // reason to force them through the email-verification flow again.
        $user->forceFill([
            'password'          => Hash::make($request->password),
            'email_verified_at' => $user->email_verified_at ?? Carbon::now(),
        ])->save();

        // Consume the reset token immediately (one-time use)
        DB::table('password_resets')->where('email', $lookupEmail)->delete();

        if ($request->filled('device_token')) {
            $user->trustDevice($request->device_token, $request);
        }

        // Revoke all previous Sanctum tokens and issue a fresh one
        $user->tokens()->delete();
        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'message'        => 'Password has been reset successfully.',
            'user'           => $user->load('barangay'),
            'token'          => $token,
            'device_trusted' => true,
        ]);
    }
}
