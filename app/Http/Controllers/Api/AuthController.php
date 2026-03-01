<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Barangay;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'barangay_id' => 'required|exists:barangays,id',
            'phone' => 'required|string|max:20',
            'sex' => 'required|in:male,female,other',
            'birth_date' => 'required|date|before:today',
            'age' => 'nullable|integer|min:0|max:150',
            'address' => 'nullable|string|max:500',
            'purok_address' => 'nullable|string|max:255',
            'id_front' => 'required|image|mimes:jpeg,png,jpg|max:5120',
            'id_back' => 'required|image|mimes:jpeg,png,jpg|max:5120',
            'device_token' => 'nullable|string|max:64',
        ]);

        $birthDate = Carbon::parse($request->birth_date);
        $calculatedAge = $birthDate->age;

        $idFrontPath = $request->file('id_front')->store('resident_ids', 'public');
        $idBackPath = $request->file('id_back')->store('resident_ids', 'public');

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'resident',
            'barangay_id' => $request->barangay_id,
            'phone' => $request->phone,
            'address' => $request->address,
            'purok_address' => $request->purok_address,
            'sex' => $request->sex,
            'birth_date' => $birthDate,
            'age' => $calculatedAge,
            'id_front_path' => $idFrontPath,
            'id_back_path' => $idBackPath,
            'is_approved' => false,
        ]);

        // Trust the registration device so login from same device won't need verification again
        if ($request->device_token) {
            $user->trustDevice($request->device_token, $request);
        }

        // Trigger native Laravel email verification (sends signed link)
        // Wrapped in try/catch so a mail delivery failure does NOT cause a 500 —
        // the user record is already saved and they can request a resend from the pending page.
        try {
            event(new \Illuminate\Auth\Events\Registered($user));
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Registration verification email failed', [
                'user_id' => $user->id,
                'email'   => $user->email,
                'error'   => $e->getMessage(),
            ]);
        }

        // Issue a token immediately so the frontend can load the /verify-pending
        // route (a PrivateRoute) and resend verification links while authenticated.
        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'message' => 'Registration successful! Please check your email to verify your account.',
            'email'   => $user->email,
            'user'    => $user->load('barangay'),
            'token'   => $token,
        ], 201);
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
            // Wrapped in try/catch: if SMTP times out or fails, login still succeeds
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
