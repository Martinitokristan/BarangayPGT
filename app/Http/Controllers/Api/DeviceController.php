<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;

class DeviceController extends Controller
{
    public function check(Request $request) 
    {
        $request->validate(['device_token' => 'required|string']);
        $user = $request->user();
        
        return response()->json([
            'trusted' => $user->hasTrustedDevice($request->device_token)
        ]);
    }

    public function resendCode(Request $request)
    {
        $user = $request->user();
        try {
            $user->sendDeviceVerificationNotification();
            return response()->json(['message' => 'Verification code sent']);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Device OTP failed', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Failed to send code'], 500);
        }
    }

    public function verify(Request $request)
    {
        $request->validate([
            'device_token' => 'required|string',
            'code' => 'required|string|size:6'
        ]);

        $user = tap($request->user())->verifyCode($request->code);
        
        if (!$user) {
            return response()->json(['message' => 'Invalid or expired code'], 422);
        }

        $request->user()->trustDevice($request->device_token, $request);

        return response()->json(['message' => 'Device verified successfully']);
    }
}
