<?php

declare(strict_types=1);

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../lib/Otp.php';

/**
 * Executable specification for features/otp_auth.feature (S3/S4/S8).
 */
final class OtpTest extends TestCase
{
    public function testGeneratedCodeIsSixDigits(): void
    {
        for ($i = 0; $i < 20; $i++) {
            self::assertMatchesRegularExpression('/^\d{6}$/', Otp::generateCode());
        }
    }

    public function testGeneratedCodesVary(): void
    {
        $codes = [];
        for ($i = 0; $i < 20; $i++) {
            $codes[] = Otp::generateCode();
        }
        self::assertGreaterThan(1, count(array_unique($codes)), 'codes must not all be identical');
    }

    public function testCustomLength(): void
    {
        self::assertMatchesRegularExpression('/^\d{8}$/', Otp::generateCode(8));
    }

    public function testHashDiffersFromCodeAndVerifies(): void
    {
        $code = '482913';
        $hash = Otp::hash($code);
        self::assertNotSame($code, $hash);
        self::assertTrue(Otp::verify($code, $hash));
        self::assertFalse(Otp::verify('000000', $hash));
    }

    public function testVerifyToleratesUserFormatting(): void
    {
        $hash = Otp::hash('123456');
        self::assertTrue(Otp::verify(' 123 456 ', $hash));
    }

    public function testVerifyRejectsEmpty(): void
    {
        $hash = Otp::hash('123456');
        self::assertFalse(Otp::verify('', $hash));
        self::assertFalse(Otp::verify('   ', $hash));
    }

    #[DataProvider('expiryCases')]
    public function testExpiry(int $now, bool $expected): void
    {
        self::assertSame($expected, Otp::isExpired(1000, 300, $now));
    }

    public static function expiryCases(): array
    {
        return [
            [1000, false],
            [1299, false],
            [1300, false],
            [1301, true],
        ];
    }

    public function testAdminAllowListIsCaseInsensitive(): void
    {
        $allow = ['boss@example.com', 'ceo@example.com'];
        self::assertTrue(Otp::isAllowedAdmin('boss@example.com', $allow));
        self::assertTrue(Otp::isAllowedAdmin('BOSS@Example.com', $allow));
        self::assertTrue(Otp::isAllowedAdmin('  ceo@example.com ', $allow));
        self::assertFalse(Otp::isAllowedAdmin('intruder@example.com', $allow));
        self::assertFalse(Otp::isAllowedAdmin('', $allow));
    }
}
