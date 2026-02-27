<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SmsLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'admin_id',
        'recipient_phone',
        'message_content',
        'status',
        'provider_message_id',
        'error_message'
    ];

    public function admin()
    {
        return $this->belongsTo(User::class, 'admin_id');
    }
}
