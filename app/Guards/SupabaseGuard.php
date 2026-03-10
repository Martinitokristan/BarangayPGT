<?php

namespace App\Guards;

use Illuminate\Auth\GuardHelpers;
use Illuminate\Contracts\Auth\Guard;
use Illuminate\Contracts\Auth\UserProvider;
use Illuminate\Http\Request;
use Firebase\JWT\JWT;
use Exception;

class SupabaseGuard implements Guard
{
    use GuardHelpers;

    protected $request;

    public function __construct(UserProvider $provider, Request $request)
    {
        $this->provider = $provider;
        $this->request = $request;
    }

    public function user()
    {
        if (! is_null($this->user)) {
            return $this->user;
        }

        $token = $this->request->bearerToken();

        if (empty($token)) {
            return null;
        }

        try {
            $secret = env('SUPABASE_JWT_SECRET'); // Must be set in .env
            
            // Supabase uses HS256 for JWT
            // use v5.x signature for compatibility with PHP 7.4
            $decoded = JWT::decode($token, $secret, ['HS256']);

            // The UUID of the user in Supabase auth is typically the 'sub' claim
            $supabaseUid = $decoded->sub;

            // Retrieve the local user by their supabase_uid
            $user = $this->provider->retrieveByCredentials(['supabase_uid' => $supabaseUid]);
            
            // Fallback: Check if the user exists locally by email from the JWT payload
            if (!$user && isset($decoded->email)) {
                $user = $this->provider->retrieveByCredentials(['email' => $decoded->email]);
                if ($user) {
                    // Backfill the supabase UID
                    $user->supabase_uid = $supabaseUid;
                    $user->save();
                }
            }

            $this->user = $user;

            return $user;
        } catch (Exception $e) {
            return null;
        }
    }

    public function validate(array $credentials = [])
    {
        return false;
    }
}
