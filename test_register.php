<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

$request = Illuminate\Http\Request::create('/api/auth/register', 'POST', [
    'name' => 'John Doe Error',
    'email' => 'testreg_01@example.com',
    'password' => 'password123',
    'barangay_id' => 1,
    'phone' => '09171234567',
    'sex' => 'male',
    'birth_date' => '2000-01-01',
    'purok_address' => 'Sample purok',
], [], [
    'valid_id' => new Illuminate\Http\UploadedFile(
        __DIR__.'/storage/app/public/resident_ids/test.jpg',
        'test.jpg',
        'image/jpeg',
        null,
        true
    )
]);

// Run it through the full app pipeline
$response = $kernel->handle($request);
echo "Status: " . $response->getStatusCode() . "\n";
echo "Body: " . $response->getContent() . "\n";
