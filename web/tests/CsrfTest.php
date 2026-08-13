<?php

declare(strict_types=1);

use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../lib/Csrf.php';

/** Executable specification for the CSRF part of csrf_and_session.feature (S4). */
final class CsrfTest extends TestCase
{
    public function testTokensAreLongRandomAndUnique(): void
    {
        $a = Csrf::generateToken();
        $b = Csrf::generateToken();
        self::assertMatchesRegularExpression('/^[0-9a-f]{32,}$/', $a);
        self::assertMatchesRegularExpression('/^[0-9a-f]{32,}$/', $b);
        self::assertNotSame($a, $b);
    }

    public function testValidationIsExact(): void
    {
        $token = Csrf::generateToken();
        self::assertTrue(Csrf::validate($token, $token));
        self::assertFalse(Csrf::validate($token . 'x', $token));
        self::assertFalse(Csrf::validate('deadbeef', $token));
    }

    public function testValidationRejectsEmptyOrMissing(): void
    {
        $token = Csrf::generateToken();
        self::assertFalse(Csrf::validate('', $token));
        self::assertFalse(Csrf::validate(null, $token));
        self::assertFalse(Csrf::validate($token, ''));
        self::assertFalse(Csrf::validate($token, null));
    }
}
