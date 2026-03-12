<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$response = $kernel->handle(
    $request = Illuminate\Http\Request::capture()
);
use App\Models\User;
use App\Models\PendingRegistration;
use App\Models\Barangay;
use Illuminate\Support\Facades\Http;

echo "1. Creating dummy Barangay if none exists...\n";
$b = Barangay::firstOrCreate(['name' => 'Test SDFSD']);

echo "2. Injecting a pending registration...\n";
$email = 'test_sms_flow_'.rand(100,999).'@example.com';
PendingRegistration::where('email', $email)->delete();
$pending = PendingRegistration::create([
    'email' => $email,
    'name' => 'SMS Test User',
    'password' => bcrypt('password123'),
    'barangay_id' => $b->id,
    'phone' => '09121234567', // Random number format
    'address' => 'Test address',
    'purok_address' => 'Test purok',
    'sex' => 'male',
    'birth_date' => '2000-01-01',
    'age' => 24,
    'id_front_path' => 'dummy_front.jpg',
    'id_back_path' => 'dummy_back.jpg',
    'otp_code' => '123456',
    'otp_expires_at' => now()->addMinutes(15),
]);

echo "3. Confirming registration directly via internal endpoint call...\n";
$req = Illuminate\Http\Request::create('/api/auth/register/confirm', 'GET', ['email' => $email, 'code' => '123456']);
$resp = $kernel->handle($req);

if ($resp->getStatusCode() !== 200) {
    echo "Failed to confirm registration: " . $resp->getStatusCode() . "\n";
    exit;
}
echo "Registered and confirmed.\n";

$user = clone User::where('email', $email)->first(); // force fresh instance 
if (!$user) {
    echo "User not found after confirm.\n";
    exit;
}

echo "4. Admin approves the user, which should trigger SMS...\n";
// Create a temporary admin
$admin = User::firstOrCreate(['email' => 'admin_test@example.com'], [
    'name' => 'Test Admin',
    'password' => bcrypt('password123'),
    'role' => 'admin',
    'barangay_id' => $b->id,
    'phone' => '09129999999',
    'is_approved' => true,
]);

$auth = Illuminate\Support\Facades\Auth::login($admin);
$approveReq = Illuminate\Http\Request::create('/api/admin/users/'.$user->id.'/approve', 'POST');
// Skip middleware and call controller directly for simplicity
$controller = app()->make(App\Http\Controllers\Api\AdminController::class);

echo "Executing AdminController::approveUser...\n";
try {
    $res = $controller->approveUser($approveReq, $user);
    if ($res->getStatusCode() === 200) {
        echo "Successfully called approve API.\n";
    } else {
        echo "API returned error: " . $res->getStatusCode(). "\n";
    }
} catch (\Exception $e) {
    echo "Error calling API: ". $e->getMessage() . "\n";
}

echo "5. Checking SMS logs...\n";
$log = App\Models\SmsLog::where('recipient_phone', $user->phone)->latest()->first();

if ($log) {
    echo "SMS Log Found!\n";
    echo "Status: " . $log->status . "\n";
    echo "Message: " . $log->message_content . "\n";
    echo "Error:   " . ($log->error_message ?? 'None') . "\n";
} else {
    echo "NO SMS LOG FOUND! Something is broken.\n";
}

// Cleanup
$user->delete();
$admin->delete();
