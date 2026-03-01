<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\Sms\SmsSender;

class SmsController extends Controller
{
    public function send(Request $request)
    {
        $request->validate([
            'to' => 'required|string',
            'message' => 'required|string',
        ]);

        $sms = new SmsSender();
        $result = $sms->send($request->to, $request->message);

        // Track the SMS activity — wrapped in try/catch so a missing table
        // or DB error does not cause a 500 and mask the actual SMS result.
        try {
            \App\Models\SmsLog::create([
                'admin_id' => $request->user() ? $request->user()->id : null,
                'recipient_phone' => $request->to,
                'message_content' => $request->message,
                'status' => $result['success'] ? 'sent' : 'failed',
                'provider_message_id' => $result['sid'] ?? null,
                'error_message' => $result['error'] ?? null,
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('SmsLog::create failed', [
                'error' => $e->getMessage(),
            ]);
        }

        if ($result['success']) {
            return response()->json(['success' => true, 'sid' => $result['sid']]);
        } else {
            // Return 422 (not 500) so the frontend can read the error message
            return response()->json(['success' => false, 'error' => $result['error']], 422);
        }
    }
}
