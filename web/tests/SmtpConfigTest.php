<?php

declare(strict_types=1);

use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../lib/SmtpConfig.php';

/** Spec for SMTP configuration loading (Mailgun transport). */
final class SmtpConfigTest extends TestCase
{
    public function testFromArrayReadsFields(): void
    {
        $cfg = SmtpConfig::fromArray([
            'host' => 'smtp.eu.mailgun.org',
            'port' => 587,
            'username' => 'user@example.com',
            'password' => 'secret',
            'from' => 'no-reply@example.com',
            'secure' => 'tls',
        ]);
        self::assertNotNull($cfg);
        self::assertSame('smtp.eu.mailgun.org', $cfg->host);
        self::assertSame(587, $cfg->port);
        self::assertSame('user@example.com', $cfg->username);
        self::assertSame('secret', $cfg->password);
        self::assertSame('no-reply@example.com', $cfg->from);
        self::assertSame('tls', $cfg->secure);
    }

    public function testFromArrayReturnsNullWhenIncomplete(): void
    {
        self::assertNull(SmtpConfig::fromArray(['host' => 'x']));
        self::assertNull(SmtpConfig::fromArray([]));
    }

    public function testLoadReturnsNullWhenFileMissing(): void
    {
        self::assertNull(SmtpConfig::load(__DIR__ . '/does-not-exist.php'));
    }

    public function testSecureDefaultsToTls(): void
    {
        $cfg = SmtpConfig::fromArray([
            'host' => 'h',
            'port' => 465,
            'username' => 'u',
            'password' => 'p',
            'from' => 'f@x',
        ]);
        self::assertNotNull($cfg);
        self::assertSame('tls', $cfg->secure);
    }
}
