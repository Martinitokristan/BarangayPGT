<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PendingRegistration extends Model
{
    protected $fillable = [
        'email',
        'name',
        'password',
        'barangay_id',
        'phone',
        'purok_address',
        'sex',
        'birth_date',
        'age',
        'valid_id_path',
        'otp_code',
        'otp_expires_at',
        'device_token',
        'email_verified_at',
    ];

    protected $casts = [
        'otp_expires_at' => 'datetime',
        'email_verified_at' => 'datetime',
        'birth_date'     => 'date',
    ];

    public function isExpired(): bool
    {
        return $this->otp_expires_at->isPast();
    }

    public function barangay()
    {
        return $this->belongsTo(Barangay::class);
    }
}
