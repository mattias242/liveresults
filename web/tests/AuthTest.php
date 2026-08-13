<?php

declare(strict_types=1);

use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../lib/Auth.php';

/** Executable specification for the session part of csrf_and_session.feature (S4). */
final class AuthTest extends TestCase
{
    public function testEmptySessionIsNotAuthenticated(): void
    {
        $session = [];
        self::assertFalse(Auth::isAuthenticated($session));
        self::assertNull(Auth::adminEmail($session));
    }

    public function testMarkedSessionIsAuthenticated(): void
    {
        $session = [];
        Auth::markAuthenticated($session, 'boss@example.com');
        self::assertTrue(Auth::isAuthenticated($session));
        self::assertSame('boss@example.com', Auth::adminEmail($session));
    }

    public function testTamperedFlagWithoutEmailIsNotAuthenticated(): void
    {
        $session = ['admin_authenticated' => true];
        self::assertFalse(Auth::isAuthenticated($session));
    }

    public function testClearRemovesAuthentication(): void
    {
        $session = [];
        Auth::markAuthenticated($session, 'boss@example.com');
        Auth::clear($session);
        self::assertFalse(Auth::isAuthenticated($session));
        self::assertNull(Auth::adminEmail($session));
    }
}
