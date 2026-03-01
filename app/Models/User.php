<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'barangay_id',
        'phone',
        'address',
        'purok_address',
        'sex',
        'birth_date',
        'age',
        'avatar',
        'cover_photo',
        'id_front_path',
        'id_back_path',
        'is_approved',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'verification_code_expires_at' => 'datetime',
        'birth_date' => 'date',
    ];

    public function barangay()
    {
        return $this->belongsTo(Barangay::class);
    }

    public function posts()
    {
        return $this->hasMany(Post::class);
    }

    public function comments()
    {
        return $this->hasMany(Comment::class);
    }

    public function reactions()
    {
        return $this->hasMany(Reaction::class);
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }

    public function followers()
    {
        return $this->hasMany(Follower::class, 'following_id');
    }

    public function following()
    {
        return $this->hasMany(Follower::class, 'follower_id');
    }

    public function isFollowing($userId)
    {
        return $this->following()->where('following_id', $userId)->exists();
    }

    public function followersCount()
    {
        return $this->followers()->count();
    }

    public function followingCount()
    {
        return $this->following()->count();
    }

    public function isAdmin()
    {
        return $this->role === 'admin';
    }

    public function isResident()
    {
        return $this->role === 'resident';
    }

    public function trustedDevices()
    {
        return $this->hasMany(TrustedDevice::class);
    }

    public function hasTrustedDevice($token)
    {
        if (!$token) return false;
        return $this->trustedDevices()->where('device_token', hash('sha256', $token))->exists();
    }

    public function trustDevice($token, $request)
    {
        if (!$token) return;
        $hashed = hash('sha256', $token);

        return $this->trustedDevices()->updateOrCreate(
            ['device_token' => $hashed],
            [
                'device_name' => substr($request->userAgent() ?? 'Unknown', 0, 255),
                'ip_address' => $request->ip(),
                'last_used_at' => now(),
            ]
        );
    }
    public function generateVerificationCode()
    {
        $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        
        $this->forceFill([
            'verification_code' => $code,
            'verification_code_expires_at' => now()->addMinutes(15),
        ])->save();

        return $code;
    }

    public function sendDeviceVerificationNotification()
    {
        $code = $this->generateVerificationCode();
        $this->notify(new \App\Notifications\DeviceVerificationOTP($code));
    }

    public function verifyCode($code)
    {
        if ($this->verification_code === $code && $this->verification_code_expires_at->isFuture()) {
            $this->forceFill([
                'verification_code' => null,
                'verification_code_expires_at' => null,
            ])->save();
            
            return true;
        }

        return false;
    }
}
