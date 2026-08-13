<?php

declare(strict_types=1);

require_once __DIR__ . '/Csrf.php';

/**
 * Admin session/authorisation helpers (finding S4).
 *
 * The pure state helpers (isAuthenticated / markAuthenticated / adminEmail /
 * clear) operate on a session array passed by reference so they are fully
 * unit-testable. The side-effectful helpers (start / requireAdmin / csrfToken)
 * bridge to $_SESSION and are exercised in integration.
 */
final class Auth
{
    /** A session counts as authenticated only when both the flag and e-mail are set. */
    public static function isAuthenticated(array $session): bool
    {
        return !empty($session['admin_authenticated'])
            && !empty($session['admin_email']);
    }

    public static function markAuthenticated(array &$session, string $email): void
    {
        $session['admin_authenticated'] = true;
        $session['admin_email'] = $email;
    }

    public static function adminEmail(array $session): ?string
    {
        if (!self::isAuthenticated($session)) {
            return null;
        }
        return (string) $session['admin_email'];
    }

    public static function clear(array &$session): void
    {
        unset($session['admin_authenticated'], $session['admin_email']);
    }

    // --- Session bridge (integration; not unit-tested) ---------------------

    /** Start a hardened session if one is not already active. */
    public static function start(): void
    {
        if (session_status() === PHP_SESSION_ACTIVE) {
            return;
        }
        session_set_cookie_params([
            'httponly' => true,
            'samesite' => 'Strict',
            'secure'   => (($_SERVER['HTTPS'] ?? '') !== '' && $_SERVER['HTTPS'] !== 'off'),
        ]);
        session_start();
    }

    /** Get (creating if needed) the per-session CSRF token. */
    public static function csrfToken(): string
    {
        self::start();
        if (empty($_SESSION['csrf_token'])) {
            $_SESSION['csrf_token'] = Csrf::generateToken();
        }
        return $_SESSION['csrf_token'];
    }

    /** Validate a submitted CSRF token against the session token. */
    public static function checkCsrf(?string $submitted): bool
    {
        self::start();
        return Csrf::validate($submitted, $_SESSION['csrf_token'] ?? null);
    }

    /** Redirect to the login page unless the current session is authenticated. */
    public static function requireAdmin(string $loginUrl = 'login.php'): void
    {
        self::start();
        if (!self::isAuthenticated($_SESSION)) {
            header('Location: ' . $loginUrl);
            exit;
        }
    }
}
