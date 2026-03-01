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
            'address'      => 'nullable|string|max:500',
            'purok_address'=> 'nullable|string|max:255',
            'id_front'     => 'required|image|mimes:jpeg,png,jpg|max:5120',
            'id_back'      => 'required|image|mimes:jpeg,png,jpg|max:5120',
            'device_token' => 'nullable|string|max:64',
        ]);

        $birthDate     = Carbon::parse($request->birth_date);
        $calculatedAge = $birthDate->age;
        $otp           = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        // Store ID photos to a staging folder — moved to resident_ids/ after verification
        $idFrontPath = $request->file('id_front')->store('resident_ids_pending', 'public');
        $idBackPath  = $request->file('id_back')->store('resident_ids_pending', 'public');

        // Replace any previous pending registration for this email
        // (e.g. user closed the tab and re-submitted the form)
        $existing = PendingRegistration::where('email', $request->email)->first();
        if ($existing) {
            Storage::disk('public')->delete([$existing->id_front_path, $existing->id_back_path]);
            $existing->delete();
        }

        PendingRegistration::create([
            'email'          => $request->email,
            'name'           => $request->name,
            'password'       => Hash::make($request->password),
            'barangay_id'    => $request->barangay_id,
            'phone'          => $request->phone,
            'address'        => $request->address,
            'purok_address'  => $request->purok_address,
            'sex'            => $request->sex,
            'birth_date'     => $birthDate->toDateString(),
            'age'            => $calculatedAge,
            'id_front_path'  => $idFrontPath,
            'id_back_path'   => $idBackPath,
            'otp_code'       => $otp,
            'otp_expires_at' => now()->addMinutes(15),
            'device_token'   => $request->device_token,
        ]);

        try {
            (new BrevoApiMailer())->sendRegistrationOtp($request->email, $request->name, $otp);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Registration OTP email failed', [
                'email' => $request->email,
                'error' => $e->getMessage(),
            ]);
        }

        return response()->json([
            'message' => 'A 6-digit verification code has been sent to your email. Please enter it to complete registration.',
            'email'   => $request->email,
        ], 201);
    }

    /**
     * Step 2 of registration: verify the OTP, create the User, and return an auth token.
     * Email is considered verified because the user proved ownership via OTP.
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

        try {
            (new BrevoApiMailer())->sendRegistrationOtp($pending->email, $pending->name, $otp);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Resend registration OTP failed', [
                'email' => $pending->email,
                'error' => $e->getMessage(),
            ]);
            return response()->json(['message' => 'Failed to send code. Please try again.'], 500);
        }

        return response()->json(['message' => 'A new verification code has been sent to your email.']);
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
