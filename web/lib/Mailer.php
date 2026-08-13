<?php

declare(strict_types=1);

/**
 * Minimal e-mail sender for admin login codes (finding S4).
 *
 * The message builder is pure and unit-tested (including header-injection
 * safety); send() is a thin wrapper over PHP mail() and is verified in
 * staging. Swap send() for an SMTP transport if the host has no local MTA.
 */
require_once __DIR__ . '/SmtpConfig.php';
require_once __DIR__ . '/MailTransport.php';

final class Mailer
{
    public const FROM = 'no-reply@liveresultat.orientering.se';

    /** Choose the transport: authenticated SMTP when configured, else mail(). */
    public static function transportFor(?SmtpConfig $config): MailTransport
    {
        return $config !== null ? new SmtpTransport($config) : new PhpMailTransport(self::FROM);
    }

    /**
     * Build the subject/body for a one-time-password e-mail.
     *
     * @return array{subject:string, body:string}
     */
    public static function buildOtpMessage(string $email, string $code, int $ttlMinutes): array
    {
        // Codes are numeric, but be defensive: never let submitted text add
        // header lines. Keep only the safe characters for display.
        $safeCode = preg_replace('/[^0-9]/', '', $code) ?? '';

        return [
            'subject' => 'Liveresultat: din inloggningskod',
            'body'    =>
                "Hej,\n\n" .
                "Din inloggningskod for Liveresultat-administrationen ar: {$safeCode}\n\n" .
                "Koden galler i {$ttlMinutes} minuter och kan bara anvandas en gang.\n\n" .
                "Om du inte begarde denna kod kan du ignorera detta meddelande.\n",
        ];
    }

    /** Send a plaintext message via the configured transport (SMTP or mail()). */
    public static function send(string $to, string $subject, string $body): bool
    {
        return self::transportFor(SmtpConfig::load())->send($to, $subject, $body);
    }
}
