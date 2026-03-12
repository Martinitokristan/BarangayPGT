<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$response = $kernel->handle(
    $request = Illuminate\Http\Request::capture()
);

use App\Services\Sms\SmsSender;

$sender = new SmsSender();
$result = $sender->send("09911876626", "Hi Test! Your BarangayPGT account has been approved. You can now open the app and access all features. Welcome!");

var_dump($result);
