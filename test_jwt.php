<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$supabaseUrl = env('SUPABASE_URL', '');
$jwksUrl = rtrim($supabaseUrl, '/') . '/auth/v1/.well-known/jwks.json';

// Use Guzzle instead of curl
$client = new \GuzzleHttp\Client(['verify' => false]);
try {
    $response = $client->get($jwksUrl);
    $body = $response->getBody()->getContents();
    file_put_contents('jwks_response.txt', $body);
    echo "OK - saved to jwks_response.txt\n";
    echo "Body length: " . strlen($body) . "\n";
    echo "First 200 chars: " . substr($body, 0, 200) . "\n";
} catch (Exception $e) {
    echo "FAIL: " . $e->getMessage() . "\n";
}
