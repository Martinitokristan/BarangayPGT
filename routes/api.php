<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PostController;
use App\Http\Controllers\Api\CommentController;
use App\Http\Controllers\Api\ReactionController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\UserProfileController;
use App\Http\Controllers\Api\EventController;
use App\Http\Controllers\Admin\AdminSmsController;
use App\Http\Controllers\Api\PasswordResetController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/register/verify', [AuthController::class, 'verifyRegistration']);
Route::get('/register/confirm', [AuthController::class, 'confirmRegistration']);
Route::get('/register/poll', [AuthController::class, 'pollRegistrationStatus']);
Route::post('/register/resend-otp', [AuthController::class, 'resendRegistrationOtp'])
    ->middleware(['throttle:6,1']);
Route::post('/login', [AuthController::class, 'login']);
Route::get('/barangays', [AuthController::class, 'barangays']);

// Password Reset — rate-limited to 3 requests per 60 minutes (security hardened)
Route::post('/forgot-password', [PasswordResetController::class, 'forgotPassword'])
    ->middleware(['throttle:password-reset'])
    ->name('password.email');
Route::post('/reset-password', [PasswordResetController::class, 'resetPassword'])
    ->middleware(['throttle:password-reset'])
    ->name('password.update');

Route::get('/email/verify/{id}/{hash}', [\App\Http\Controllers\Api\VerificationController::class, 'verifyEmail'])
    ->name('verification.verify');
Route::post('/email/verify-code', [\App\Http\Controllers\Api\VerificationController::class, 'verifyCode']);
Route::post('/email/resend-code', [\App\Http\Controllers\Api\VerificationController::class, 'resendCode'])
    ->middleware(['throttle:6,1'])
    ->name('verification.resend');

// Authenticated routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    // Email verification resend (used from /verify-pending page after registration)
    Route::post('/email/verification-notification', [\App\Http\Controllers\Api\VerificationController::class, 'resendVerificationLink'])
        ->middleware(['throttle:6,1'])
        ->name('verification.send');

    // Posts
    Route::get('/posts', [PostController::class, 'index']);
    Route::post('/posts', [PostController::class, 'store']);
    Route::get('/posts/{post}', [PostController::class, 'show']);
    Route::put('/posts/{post}', [PostController::class, 'update']);
    Route::delete('/posts/{post}', [PostController::class, 'destroy']);

    // Comments
    Route::get('/posts/{post}/comments', [CommentController::class, 'index']);
    Route::post('/posts/{post}/comments', [CommentController::class, 'store']);
    Route::put('/posts/{post}/comments/{comment}', [CommentController::class, 'update']);
    Route::delete('/posts/{post}/comments/{comment}', [CommentController::class, 'destroy']);
    Route::post('/posts/{post}/comments/{comment}/like', [CommentController::class, 'toggleLike']);

    // Reactions
    Route::post('/posts/{post}/reactions', [ReactionController::class, 'toggle']);


    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::put('/notifications/{notification}/read', [NotificationController::class, 'markAsRead']);
    Route::put('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);

    // SMS Messaging
    Route::post('/sms/send', [\App\Http\Controllers\Api\SmsController::class, 'send']);

    // User Profiles
    Route::get('/users/search', [UserProfileController::class, 'search']);
    Route::get('/users/{user}/profile', [UserProfileController::class, 'show']);
    Route::get('/users/{user}/posts', [UserProfileController::class, 'posts']);
    Route::post('/users/{user}/follow', [UserProfileController::class, 'follow']);
    Route::post('/users/{user}/follow/notifications', [UserProfileController::class, 'toggleNotifications']);
    Route::post('/users/{user}/follow/snooze', [UserProfileController::class, 'snooze']);
    Route::post('/users/profile-photo', [UserProfileController::class, 'updateProfilePhoto']);
    Route::post('/users/cover-photo', [UserProfileController::class, 'updateCoverPhoto']);

    // Events
    Route::apiResource('events', EventController::class);

    // Admin routes
    Route::middleware('admin')->prefix('admin')->group(function () {
        Route::get('/dashboard', [AdminController::class, 'dashboard']);
        Route::get('/users', [AdminController::class, 'users']);
        Route::put('/users/{user}/role', [AdminController::class, 'updateUserRole']);
        Route::post('/users/{user}/approve', [AdminController::class, 'approveUser']);
        Route::delete('/users/{user}/reject', [AdminController::class, 'rejectUser']);
        Route::get('/barangays', [AdminController::class, 'barangays']);
        Route::post('/barangays', [AdminController::class, 'storeBarangay']);
        
        // SMS routes
        Route::get('/users/{user}/phone', [AdminSmsController::class, 'getUserPhone']);
        Route::post('/users/{user}/send-sms', [AdminSmsController::class, 'sendToUser']);
        Route::get('/sms/logs', [AdminSmsController::class, 'getLogs']);
    });
});
