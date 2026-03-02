<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PendingRegistration;
use App\Models\User;
use App\Models\Barangay;
use App\Services\Mail\BrevoApiMailer;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Step 1 of registration: validate, store files, save to pending_registrations
     * and send a 6-digit OTP to the user's email.
     * The actual User record is NOT created here — it is created in verifyRegistration()
     * once the user proves ownership of their email address.
     */
    public function register(Request $request)
    {
        $request->validate([
            'name'         => 'required|string|max:255',
            'email'        => 'required|string|email|max:255|unique:users',
            'password'     => 'required|string|min:8|confirmed',
            'barangay_id'  => 'required|exists:barangays,id',
            'phone'        => 'required|string|max:20',
            'sex'          => 'required|in:male,female,other',
            'birth_date'   => 'required|date|before:today',
            'age'          => 'nullable|integer|min:0|max:150',
            'purok_address'=> 'required|string|max:255',
            'valid_id'     => 'required|image|mimes:jpeg,png,jpg|max:5120',
            'device_token' => 'nullable|string|max:64',
        ]);

        $birthDate     = Carbon::parse($request->birth_date);
        $calculatedAge = $birthDate->age;
        $otp           = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        // Store ID photo to a staging folder — moved to resident_ids/ after verification
        $validIdPath = $request->file('valid_id')->store('resident_ids_pending', 'public');

        // Replace any previous pending registration for this email
        // (e.g. user closed the tab and re-submitted the form)
        $existing = PendingRegistration::where('email', $request->email)->first();
        if ($existing) {
            Storage::disk('public')->delete($existing->valid_id_path);
            $existing->delete();
        }

        PendingRegistration::create([
            'email'          => $request->email,
            'name'           => $request->name,
            'password'       => Hash::make($request->password),
            'barangay_id'    => $request->barangay_id,
            'phone'          => $request->phone,
            'purok_address'  => $request->purok_address,
            'sex'            => $request->sex,
            'birth_date'     => $birthDate->toDateString(),
            'age'            => $calculatedAge,
            'valid_id_path'  => $validIdPath,
            'otp_code'       => $otp,
            'otp_expires_at' => now()->addMinutes(15),
            'device_token'   => $request->device_token,
        ]);

        $verifyUrl = rtrim(config('app.url'), '/') . '/api/register/confirm'
            . '?email=' . urlencode($request->email)
            . '&code=' . $otp;

        try {
            (new BrevoApiMailer())->sendRegistrationLink($request->email, $request->name, $verifyUrl);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Registration verification email failed', [
                'email' => $request->email,
                'error' => $e->getMessage(),
            ]);
        }

        return response()->json([
            'message' => 'A verification link has been sent to your email. Click the link to complete registration.',
            'email'   => $request->email,
        ], 201);
    }

    /**
     * Step 2a — GET endpoint the email link points to directly (opened in Gmail/browser).
     * Verifies OTP, creates the User, stores token in cache for the waiting SPA to pick up.
     * Returns a plain HTML page the user sees in their email app.
     */
    public function confirmRegistration(Request $request)
    {
        $email = $request->query('email');
        $code  = $request->query('code');

        if (!$email || !$code) {
            return response($this->htmlPage('Invalid Link', '#dc2626', 'This verification link is invalid. Please request a new one from the app.'), 400)
                ->header('Content-Type', 'text/html');
        }

        $pending = PendingRegistration::where('email', $email)->first();

        if (!$pending) {
            return response($this->htmlPage('Already Verified', '#16a34a', 'Your email has already been verified. You can return to the app and log in.'), 200)
                ->header('Content-Type', 'text/html');
        }

        if ($pending->otp_code !== $code) {
            return response($this->htmlPage('Invalid Link', '#dc2626', 'This verification link is invalid. Please request a new one from the app.'), 422)
                ->header('Content-Type', 'text/html');
        }

        if ($pending->isExpired()) {
            return response($this->htmlPage('Link Expired', '#d97706', 'This verification link has expired (15 minutes). Please request a new one from the app.'), 422)
                ->header('Content-Type', 'text/html');
        }

        // Move ID photo from staging to permanent folder
        $newValidIdPath = str_replace('resident_ids_pending/', 'resident_ids/', $pending->valid_id_path);
        Storage::disk('public')->move($pending->valid_id_path, $newValidIdPath);

        $user = User::create([
            'name'              => $pending->name,
            'email'             => $pending->email,
            'password'          => $pending->password,
            'role'              => 'resident',
            'barangay_id'       => $pending->barangay_id,
            'phone'             => $pending->phone,
            'purok_address'     => $pending->purok_address,
            'sex'               => $pending->sex,
            'birth_date'        => $pending->birth_date,
            'age'               => $pending->age,
            'valid_id_path'     => $newValidIdPath,
            'is_approved'       => false,
            'email_verified_at' => now(),
        ]);

        if ($pending->device_token) {
            $user->trustDevice($pending->device_token, $request);
        }

        $pending->delete();

        $token = $user->createToken('auth-token')->plainTextToken;

        // Store in cache — the SPA /register/poll endpoint picks this up
        $cacheKey = 'reg_verified_' . md5(strtolower(trim($email)));
        Cache::put($cacheKey, [
            'token' => $token,
            'user'  => $user->load('barangay')->toArray(),
        ], now()->addMinutes(10));

        return response($this->htmlPage(
            'Email Verified!',
            '#16a34a',
            'Your email has been verified successfully. You can close this tab — the app is loading your account.'
        ), 200)->header('Content-Type', 'text/html');
    }

    /**
     * Step 2b — Polling endpoint called by the waiting SPA every few seconds.
     * Returns {verified: true, token, user} once confirmRegistration() completes,
     * otherwise {verified: false}.
     */
    public function pollRegistrationStatus(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        $email    = strtolower(trim($request->email));
        $cacheKey = 'reg_verified_' . md5($email);
        $data     = Cache::get($cacheKey);

        if ($data) {
            // Primary path: cache hit from confirmRegistration
            Cache::forget($cacheKey);
            return response()->json([
                'verified' => true,
                'token'    => $data['token'],
                'user'     => $data['user'],
            ]);
        }

        // Fallback: cache may have been missed (timing, process mismatch, etc.)
        // If no pending row exists but a user does, confirmation already ran.
        $pending = \App\Models\PendingRegistration::where('email', $email)->first();
        if (!$pending) {
            $user = User::where('email', $email)->first();
            if ($user) {
                $token = $user->createToken('auth-token')->plainTextToken;
                return response()->json([
                    'verified' => true,
                    'token'    => $token,
                    'user'     => $user->load('barangay')->toArray(),
                ]);
            }
        }

        return response()->json(['verified' => false]);
    }

    /** Small HTML page returned directly to the user's email browser/webview. */
    private function htmlPage(string $title, string $color, string $message): string
    {
        return <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>{$title} – BarangayPGT</title>
</head>
<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f3f4f6;font-family:Arial,sans-serif">
  <div style="background:#fff;border-radius:12px;padding:40px 32px;max-width:420px;width:90%;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,.08)">
    <div style="font-size:52px;margin-bottom:16px">✅</div>
    <h1 style="color:{$color};font-size:1.5rem;margin:0 0 12px">{$title}</h1>
    <p style="color:#4b5563;line-height:1.6;margin:0">{$message}</p>
  </div>
</body>
</html>
HTML;
    }

    /**
     * Step 2 of registration (legacy/fallback): verify OTP via JSON POST and return token.
     */
    public function verifyRegistration(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'code'  => 'required|string|size:6',
        ]);

        $pending = PendingRegistration::where('email', $request->email)->first();

        if (!$pending) {
            return response()->json(['message' => 'No pending registration found for this email.'], 404);
        }

        if ($pending->otp_code !== $request->code) {
            return response()->json(['message' => 'Invalid verification code.'], 422);
        }

        if ($pending->isExpired()) {
            return response()->json(['message' => 'Verification code has expired. Please register again.'], 422);
        }

        // Move ID photos from staging folder to permanent folder
        $newFrontPath = str_replace('resident_ids_pending/', 'resident_ids/', $pending->id_front_path);
        $newBackPath  = str_replace('resident_ids_pending/', 'resident_ids/', $pending->id_back_path);
        Storage::disk('public')->move($pending->id_front_path, $newFrontPath);
        Storage::disk('public')->move($pending->id_back_path, $newBackPath);

        $user = User::create([
            'name'              => $pending->name,
            'email'             => $pending->email,
            'password'          => $pending->password, // already hashed
            'role'              => 'resident',
            'barangay_id'       => $pending->barangay_id,
            'phone'             => $pending->phone,
            'address'           => $pending->address,
            'purok_address'     => $pending->purok_address,
            'sex'               => $pending->sex,
            'birth_date'        => $pending->birth_date,
            'age'               => $pending->age,
            'id_front_path'     => $newFrontPath,
            'id_back_path'      => $newBackPath,
            'is_approved'       => false,
            'email_verified_at' => now(), // OTP proves email ownership
        ]);

        // Trust the device used during registration
        if ($pending->device_token) {
            $user->trustDevice($pending->device_token, $request);
        }

        $pending->delete();

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'message' => 'Registration complete! Welcome to BarangayPGT.',
            'user'    => $user->load('barangay'),
            'token'   => $token,
        ]);
    }

    /**
     * Resend a new OTP to a pending registration's email.
     */
    public function resendRegistrationOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $pending = PendingRegistration::where('email', $request->email)->first();

        if (!$pending) {
            return response()->json(['message' => 'No pending registration found for this email.'], 404);
        }

        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $pending->update([
            'otp_code'       => $otp,
            'otp_expires_at' => now()->addMinutes(15),
        ]);

        $verifyUrl = rtrim(config('app.url'), '/') . '/api/register/confirm'
            . '?email=' . urlencode($pending->email)
            . '&code=' . $otp;

        try {
            (new BrevoApiMailer())->sendRegistrationLink($pending->email, $pending->name, $verifyUrl);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Resend registration link failed', [
                'email' => $pending->email,
                'error' => $e->getMessage(),
            ]);
            return response()->json(['message' => 'Failed to send link. Please try again.'], 500);
        }

        return response()->json(['message' => 'A new verification link has been sent to your email.']);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
            'device_token' => 'nullable|string|max:64',
        ]);

        if (!Auth::attempt($request->only('email', 'password'))) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $user = User::where('email', $request->email)->first();
        $deviceToken = $request->device_token;
        $deviceTrusted = false;

        // Admins are exempt from device trust/verification checks
        if ($user->role === 'admin') {
            $deviceTrusted = true;
        } elseif ($user->hasTrustedDevice($deviceToken)) {
            // Known/trusted device — no verification needed
            $deviceTrusted = true;
            $user->trustDevice($deviceToken, $request); // update last_used_at
        } else {
            // New/unknown device — send verification code for identity confirmation.
            // Wrapped in try/catch: if email delivery fails, login still succeeds
            // and the user can request a resend from the OTP screen.
            try {
                $user->sendDeviceVerificationNotification();
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('Device verification OTP email failed', [
                    'user_id' => $user->id,
                    'error'   => $e->getMessage(),
                ]);
            }
            $deviceTrusted = false;
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user' => $user->load('barangay'),
            'token' => $token,
            'device_trusted' => $deviceTrusted,
        ]);
    }

    public function logout(Request $request)
    {
        $user = $request->user();
        
        // If authenticated via Sanctum token
        if ($user->currentAccessToken() && method_exists($user->currentAccessToken(), 'delete')) {
            $user->currentAccessToken()->delete();
        }

        // If authenticated via session
        Auth::guard('web')->logout();

        return response()->json(['message' => 'Logged out successfully']);
    }

    public function user(Request $request)
    {
        return response()->json($request->user()->load('barangay'));
    }

    public function barangays()
    {
        return response()->json(Barangay::all());
    }
}
