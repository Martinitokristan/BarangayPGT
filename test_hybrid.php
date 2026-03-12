<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

try {
    $admin = \App\Models\User::where('role', 'admin')->first();
    echo 'Admin: ' . ($admin ? $admin->email : 'Not found') . PHP_EOL;
    
    // Clean up
    \App\Models\PendingRegistration::where('email', 'hybrid@example.com')->delete();
    \App\Models\User::where('email', 'hybrid@example.com')->delete();
    
    // 1. Register Mock
    $pending = \App\Models\PendingRegistration::create([
        'name' => 'Hybrid User',
        'email' => 'hybrid@example.com',
        'password' => bcrypt('password123'),
        'barangay_id' => 1,
        'phone' => '09171234567',
        'sex' => 'male',
        'birth_date' => '2000-01-01',
        'purok_address' => 'Sample purok',
        'valid_id_path' => 'resident_ids_pending/test.png',
        'otp_code' => '123456',
        'otp_expires_at' => now()->addMinutes(15),
    ]);
    
    echo 'Created pending registration ID: ' . $pending->id . PHP_EOL;
    
    // 2. Mock Admin Route Call
    $request = \Illuminate\Http\Request::create('/api/users/' . $pending->id . '/approve', 'POST');
    $request->setUserResolver(function() use ($admin) { return $admin; });
    
    $controller = new \App\Http\Controllers\Api\AdminController();
    $response = $controller->approveUser($request, $pending->id);
    
    echo 'Response Code: ' . $response->getStatusCode() . PHP_EOL;
    echo 'Body: ' . $response->getContent() . PHP_EOL;
    
} catch (\Throwable $e) {
    echo 'Error Details: ' . $e->getMessage() . PHP_EOL;
    echo 'In file: ' . $e->getFile() . ':' . $e->getLine() . PHP_EOL;
    echo $e->getTraceAsString() . PHP_EOL;
}
