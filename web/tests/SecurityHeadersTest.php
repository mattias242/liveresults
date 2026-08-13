<?php

declare(strict_types=1);

use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../lib/SecurityHeaders.php';

/**
 * Executable specification for features/security_headers.feature (finding S10).
 */
final class SecurityHeadersTest extends TestCase
{
    public function testHtmlHeadersBlockFramingAndSniffing(): void
    {
        $h = SecurityHeaders::forHtml();
        self::assertSame('SAMEORIGIN', $h['X-Frame-Options']);
        self::assertSame('nosniff', $h['X-Content-Type-Options']);
        self::assertArrayHasKey('Referrer-Policy', $h);
        self::assertNotSame('', $h['Referrer-Policy']);
        self::assertArrayHasKey('Content-Security-Policy', $h);
        self::assertStringContainsString("frame-ancestors 'self'", $h['Content-Security-Policy']);
    }

    public function testJsonHeadersForbidSniffing(): void
    {
        $h = SecurityHeaders::forJson();
        self::assertSame('nosniff', $h['X-Content-Type-Options']);
    }

    public function testHstsAdvertised(): void
    {
        $h = SecurityHeaders::forHtml();
        self::assertArrayHasKey('Strict-Transport-Security', $h);
        self::assertMatchesRegularExpression('/max-age=\d+/', $h['Strict-Transport-Security']);
    }

    public function testHeaderNamesAreWellFormed(): void
    {
        foreach ([SecurityHeaders::forHtml(), SecurityHeaders::forJson()] as $set) {
            foreach ($set as $name => $value) {
                self::assertIsString($name);
                self::assertMatchesRegularExpression('/^[A-Za-z0-9-]+$/', $name);
                self::assertStringNotContainsString("\n", $value, "header $name must not allow injection");
                self::assertStringNotContainsString("\r", $value, "header $name must not allow injection");
            }
        }
    }
}
