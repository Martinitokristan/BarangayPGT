<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Foundation\Auth\EmailVerificationRequest;
use Illuminate\Http\Request;

class VerificationController extends Controller
{
    /**
     * Mark the authenticated user's email address as verified from the email link.
     */
    public function verifyEmail($id, $hash, Request $request)
    {
        $user = User::findOrFail($id);

        if (!hash_equals((string) $hash, sha1($user->getEmailForVerification()))) {
            return response()->json(['message' => 'Invalid email verification link.'], 403);
        }

        if ($user->hasVerifiedEmail()) {
            return response()->json(['message' => 'Email already verified.'], 400);
        }

        // Must manually check the signature because this is called as a generic API endpoint by the SPA
        if (!$request->hasValidSignature()) {
            return response()->json(['message' => 'Invalid or expired verification link.'], 403);
        }

        $user->markEmailAsVerified();

        // Automatically log them in returning a new sanctum token so they don't have to log in manually again
        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'message' => 'Email has been successfully verified! You can now access all features.',
            'user' => $user->load('barangay'),
            'token' => $token,
        ]);
    }

    /**
     * Mark the authenticated user's email address as verified using a 6-digit code.
     */
    public function verifyCode(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
            'code' => 'required|string|size:6',
        ]);

        $user = User::where('email', $request->email)->first();

        // Removed the check `if ($user->hasVerifiedEmail())` because this endpoint 
        // is now exclusively used for New Device Login OTP, which applies TO verified users.

        if ($user->verifyCode($request->code)) {
            // Trust the current device upon successful verification
            $deviceToken = $request->header('X-Device-Token');
            if ($deviceToken) {
                $user->trustDevice($deviceToken, $request);
            }

            return response()->json([
                'message' => 'Email has been successfully verified! You can now access all features.'
            ]);
        }

        return response()->json(['message' => 'Invalid or expired verification code.'], 422);
    }

    /**
     * Resend the signed email verification link (used from /verify-pending page).
     * Requires the user to be authenticated (token issued at registration).
     */
    public function resendVerificationLink(Request $request)
    {
        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return response()->json(['message' => 'Email is already verified.'], 400);
        }

        try {
            $user->sendEmailVerificationNotification();
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Resend verification email failed', [
                'user_id' => $user->id,
                'error'   => $e->getMessage(),
            ]);
            return response()->json(['message' => 'Failed to send verification email. Please try again later.'], 500);
        }

        return response()->json(['status' => 'verification-link-sent', 'message' => 'A new verification link has been sent to your email address.']);
    }

    /**
     * Resend the 6-digit verification code.
     */
    public function resendCode(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
        ]);

        $user = User::where('email', $request->email)->first();

        // This resend is for the 6-digit device login OTP.
        try {
            $user->sendDeviceVerificationNotification();
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Resend OTP email failed', [
                'user_id' => $user->id,
                'error'   => $e->getMessage(),
            ]);
            return response()->json(['message' => 'Failed to send code. Please try again later.'], 500);
        }

        return response()->json(['message' => 'New verification code sent!']);
    }
}
