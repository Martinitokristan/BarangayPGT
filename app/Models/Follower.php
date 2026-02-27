<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Follower extends Model
{
    protected $fillable = [
        'follower_id',
        'following_id',
        'notify',
        'snoozed_until',
    ];

    protected $casts = [
        'notify' => 'boolean',
        'snoozed_until' => 'datetime',
    ];

    public function follower()
    {
        return $this->belongsTo(User::class, 'follower_id');
    }

    public function following()
    {
        return $this->belongsTo(User::class, 'following_id');
    }

    public static function isFollowing($followerId, $followingId)
    {
        return self::where('follower_id', $followerId)
                    ->where('following_id', $followingId)
                    ->exists();
    }
}
