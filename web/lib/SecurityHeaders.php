<?php

declare(strict_types=1);

/**
 * Baseline HTTP security headers (finding S10).
 *
 * Framing is blocked per the organiser's decision that no third-party site
 * needs to embed the viewer. The Content-Security-Policy intentionally only
 * constrains framing for now (frame-ancestors) because the legacy pages rely
 * heavily on inline scripts; a script-src policy is deferred to the SPA
 * rewrite (Fas 3).
 */
final class SecurityHeaders
{
    /** Headers for HTML pages. */
    public static function forHtml(): array
    {
        return [
            'X-Frame-Options'           => 'SAMEORIGIN',
            'X-Content-Type-Options'    => 'nosniff',
            'Referrer-Policy'           => 'strict-origin-when-cross-origin',
            'Content-Security-Policy'   => "frame-ancestors 'self'",
            'Strict-Transport-Security' => 'max-age=15552000',
        ];
    }

    /** Headers for JSON/API responses. */
    public static function forJson(): array
    {
        return [
            'X-Content-Type-Options'    => 'nosniff',
            'Referrer-Policy'           => 'strict-origin-when-cross-origin',
            'Strict-Transport-Security' => 'max-age=15552000',
        ];
    }

    /** Emit the given header set. Safe to call before any output. */
    public static function apply(array $headers): void
    {
        if (headers_sent()) {
            return;
        }
        foreach ($headers as $name => $value) {
            header($name . ': ' . $value);
        }
    }
}
