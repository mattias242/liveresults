<?php

declare(strict_types=1);

use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../lib/Mailer.php';

/** Executable spec for the pure part of the admin login e-mail (S4). */
final class MailerTest extends TestCase
{
    public function testOtpMessageContainsCodeAndLifetime(): void
    {
        $msg = Mailer::buildOtpMessage('boss@example.com', '246813', 5);
        self::assertArrayHasKey('subject', $msg);
        self::assertArrayHasKey('body', $msg);
        self::assertNotSame('', $msg['subject']);
        self::assertStringContainsString('246813', $msg['body']);
        self::assertStringContainsString('5', $msg['body']);
    }

    public function testOtpMessageHasNoHeaderInjection(): void
    {
        // A crafted code must never introduce CR/LF into subject or body-as-header.
        $msg = Mailer::buildOtpMessage('boss@example.com', "1\r\nBcc: evil@example.com", 5);
        self::assertStringNotContainsString("\r", $msg['subject']);
        self::assertStringNotContainsString("\n", $msg['subject']);
    }
}
