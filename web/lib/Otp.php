<?php

declare(strict_types=1);

/**
 * One-time-password primitives for the "user + code by e-mail" admin login
 * (findings S3/S4/S8).
 *
 * Pure, storage-agnostic helpers: code generation, hashing/verification,
 * lifetime checks and admin allow-list matching. Storage, e-mail delivery and
 * the session are layered on top of these.
 */
final class Otp
{
    /** Generate a cryptographically random numeric code of the given length. */
    public static function generateCode(int $digits = 6): string
    {
        if ($digits < 1) {
            $digits = 6;
        }
        $code = '';
        for ($i = 0; $i < $digits; $i++) {
            $code .= (string) random_int(0, 9);
        }
        return $code;
    }

    /** Hash a code for storage (never store the raw code). */
    public static function hash(string $code): string
    {
        return password_hash(self::normalize($code), PASSWORD_DEFAULT);
    }

    /** Constant-time verification of a user-submitted code against a stored hash. */
    public static function verify(string $submitted, string $hash): bool
    {
        $normalized = self::normalize($submitted);
        if ($normalized === '' || $hash === '') {
            return false;
        }
        return password_verify($normalized, $hash);
    }

    /**
     * Whether a code issued at $issuedAt with a $ttlSeconds lifetime is expired
     * at $now. Boundary ($issuedAt + $ttl) is still valid.
     */
    public static function isExpired(int $issuedAt, int $ttlSeconds, int $now): bool
    {
        return $now > ($issuedAt + $ttlSeconds);
    }

    /** Case-insensitive, whitespace-tolerant admin allow-list check. */
    public static function isAllowedAdmin(string $email, array $allowList): bool
    {
        $needle = strtolower(trim($email));
        if ($needle === '') {
            return false;
        }
        foreach ($allowList as $allowed) {
            if (strtolower(trim((string) $allowed)) === $needle) {
                return true;
            }
        }
        return false;
    }

    /** Strip whitespace a user might paste into the code field. */
    public static function normalize(string $code): string
    {
        return preg_replace('/\s+/', '', $code) ?? '';
    }
}
