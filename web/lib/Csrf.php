<?php

declare(strict_types=1);

/**
 * CSRF token helpers (finding S4).
 *
 * Token generation and constant-time comparison are pure; the session glue
 * (storing the token in $_SESSION, emitting the hidden field) lives in Auth /
 * the page templates so this class stays unit-testable.
 */
final class Csrf
{
    /** Generate an unguessable token (64 hex chars = 32 random bytes). */
    public static function generateToken(): string
    {
        return bin2hex(random_bytes(32));
    }

    /** Constant-time exact match of a submitted token against the expected one. */
    public static function validate(?string $submitted, ?string $expected): bool
    {
        if (!is_string($submitted) || !is_string($expected)) {
            return false;
        }
        if ($submitted === '' || $expected === '') {
            return false;
        }
        return hash_equals($expected, $submitted);
    }
}
