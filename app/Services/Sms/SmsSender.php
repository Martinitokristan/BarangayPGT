<?php

namespace App\Services\Sms;

use Illuminate\Support\Facades\Http;

class SmsSender
{
    protected $apiToken;
    protected $endpoint;

    public function __construct()
    {
        $this->apiToken = config('services.iprog.api_token');
        $this->endpoint = config('services.iprog.endpoint');
    }

    /**
     * Send an SMS message to a phone number.
     *
     * @param string $to
     * @param string $message
     * @return array
     */
    public function send($to, $message)
    {
        try {
            // Remove +63 prefix and add 63 if needed for IPROG format
            $phoneNumber = $to;
            if (strpos($to, '+63') === 0) {
                $phoneNumber = '63' . substr($to, 3);
            } elseif (strpos($to, '0') === 0) {
                $phoneNumber = '63' . substr($to, 1);
            }

            $response = Http::post($this->endpoint, [
                'api_token' => $this->apiToken,
                'phone_number' => $phoneNumber,
                'message' => $message,
                'sms_provider' => 0
            ]);

            $data = $response->json();

            if ($response->successful() && isset($data['status']) && $data['status'] == 200) {
                return [
                    'success' => true, 
                    'sid' => $data['message_id'] ?? uniqid()
                ];
            } else {
                return [
                    'success' => false, 
                    'error' => $data['message'] ?? 'SMS sending failed'
                ];
            }
        } catch (\Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
}
