<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Sms\SmsSender;
use Illuminate\Http\Request;

class AdminSmsController extends Controller
{
    protected $smsSender;

    public function __construct()
    {
        $this->smsSender = new SmsSender();
    }

    /**
     * Send SMS to a specific user
     */
    public function sendToUser(Request $request, User $user)
    {
        $request->validate([
            'message' => 'required|string|max:500'
        ]);

        // Check if user has phone number
        if (!$user->phone) {
            return response()->json([
                'success' => false,
                'error' => 'User does not have a phone number'
            ], 400);
        }

        // Send SMS
        $result = $this->smsSender->send($user->phone, $request->message);

        // Track the SMS activity
        \App\Models\SmsLog::create([
            'admin_id' => $request->user()->id,
            'recipient_phone' => $user->phone,
            'message_content' => $request->message,
            'status' => $result['success'] ? 'sent' : 'failed',
            'provider_message_id' => $result['sid'] ?? null,
            'error_message' => $result['error'] ?? null
        ]);

        if ($result['success']) {
            return response()->json([
                'success' => true,
                'message' => 'SMS sent successfully to ' . $user->name,
                'sid' => $result['sid']
            ]);
        } else {
            return response()->json([
                'success' => false,
                'error' => $result['error']
            ], 500);
        }
    }

    /**
     * Get user phone number for display
     */
    public function getUserPhone(User $user)
    {
        return response()->json([
            'phone' => $user->phone ? $this->formatPhoneNumber($user->phone) : null,
            'has_phone' => !empty($user->phone)
        ]);
    }

    /**
     * Format phone number for display
     */
    private function formatPhoneNumber($phone)
    {
        // Convert to international format if needed
        if (strpos($phone, '09') === 0) {
            return '+63' . substr($phone, 1);
        } elseif (strpos($phone, '+63') === 0) {
            return $phone;
        } elseif (strpos($phone, '63') === 0) {
            return '+' . $phone;
        }
        
        return $phone;
    }

    /**
     * Get SMS logs for the dashboard
     */
    public function getLogs()
    {
        $logs = \App\Models\SmsLog::with('admin:id,name')
            ->orderBy('created_at', 'desc')
            ->paginate(50);

        return response()->json($logs);
    }
}
