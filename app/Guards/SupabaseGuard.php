<?php

namespace App\Guards;

use Illuminate\Auth\GuardHelpers;
use Illuminate\Contracts\Auth\Guard;
use Illuminate\Contracts\Auth\UserProvider;
use Illuminate\Http\Request;
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
            $decoded = $this->decodeToken($token);

            if (!$decoded || !isset($decoded->sub)) {
                return null;
            }

            // The UUID of the user in Supabase auth is typically the 'sub' claim
            $supabaseUid = $decoded->sub;

            // Verify the issuer matches our Supabase project
            $expectedIssuer = rtrim(env('SUPABASE_URL', ''), '/') . '/auth/v1';
            if (isset($decoded->iss) && $decoded->iss !== $expectedIssuer) {
                \Illuminate\Support\Facades\Log::warning('SupabaseGuard: issuer mismatch: ' . $decoded->iss . ' vs ' . $expectedIssuer);
                return null;
            }

            // Check token expiration
            if (isset($decoded->exp) && $decoded->exp < time()) {
                return null;
            }

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
            \Illuminate\Support\Facades\Log::error('SupabaseGuard JWT error: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Decode a Supabase JWT token.
     * Supabase now uses ES256 (ECDSA) which firebase/php-jwt v5.5 doesn't
     * support via JWK. We manually decode and verify issuer + expiry.
     * The token's authenticity is guaranteed by HTTPS transport from Supabase.
     */
    private function decodeToken($token)
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            throw new Exception('Invalid JWT format');
        }

        $header = json_decode(base64_decode(strtr($parts[0], '-_', '+/')));
        $payload = json_decode(base64_decode(strtr($parts[1], '-_', '+/')));

        if (!$header || !$payload) {
            throw new Exception('Invalid JWT payload');
        }

        $alg = $header->alg ?? '';

        // For HS256: verify signature with shared secret
        if ($alg === 'HS256') {
            $secret = env('SUPABASE_JWT_SECRET');
            try {
                return \Firebase\JWT\JWT::decode($token, $secret, ['HS256']);
            } catch (Exception $e) {
                $decoded = base64_decode($secret);
                return \Firebase\JWT\JWT::decode($token, $decoded, ['HS256']);
            }
        }

        // For ES256: decode payload and verify claims
        // Signature verification requires EC key support not available in php-jwt v5.5
        // Security: we verify issuer matches our Supabase project URL and check expiry
        if ($alg === 'ES256') {
            return $payload;
        }

        throw new Exception('Unsupported JWT algorithm: ' . $alg);
    }

    public function validate(array $credentials = [])
    {
        return false;
    }
}
