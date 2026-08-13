<?php

declare(strict_types=1);

use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../lib/SmtpConfig.php';
require_once __DIR__ . '/../lib/MailTransport.php';
require_once __DIR__ . '/../lib/Mailer.php';

/** Spec for transport selection (SMTP when configured, else PHP mail()). */
final class MailTransportTest extends TestCase
{
    public function testChoosesSmtpWhenConfigured(): void
    {
        $cfg = SmtpConfig::fromArray([
            'host' => 'smtp.eu.mailgun.org', 'port' => 587,
            'username' => 'u', 'password' => 'p', 'from' => 'f@x',
        ]);
        self::assertInstanceOf(SmtpTransport::class, Mailer::transportFor($cfg));
    }

    public function testFallsBackToMailWhenNoConfig(): void
    {
        self::assertInstanceOf(PhpMailTransport::class, Mailer::transportFor(null));
    }

    public function testSmtpTransportRejectsInvalidRecipient(): void
    {
        $cfg = SmtpConfig::fromArray([
            'host' => 'h', 'port' => 587, 'username' => 'u', 'password' => 'p', 'from' => 'f@x',
        ]);
        $transport = new SmtpTransport($cfg);
        // Must fail closed before attempting any network/PHPMailer work.
        self::assertFalse($transport->send("bad\r\nto", 'subj', 'body'));
    }
}
