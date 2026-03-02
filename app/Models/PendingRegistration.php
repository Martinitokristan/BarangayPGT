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
    ];

    protected $casts = [
        'otp_expires_at' => 'datetime',
        'birth_date'     => 'date',
    ];

    public function isExpired(): bool
    {
        return $this->otp_expires_at->isPast();
    }
}
