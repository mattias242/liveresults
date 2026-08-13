<?php

declare(strict_types=1);

/**
 * Minimal e-mail sender for admin login codes (finding S4).
 *
 * The message builder is pure and unit-tested (including header-injection
 * safety); send() is a thin wrapper over PHP mail() and is verified in
 * staging. Swap send() for an SMTP transport if the host has no local MTA.
 */
final class Mailer
{
    public const FROM = 'no-reply@liveresultat.orientering.se';

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

    /** Send a plaintext message. Returns whether mail() accepted it. */
    public static function send(string $to, string $subject, string $body): bool
    {
        // Reject addresses that could smuggle extra headers.
        if (!filter_var($to, FILTER_VALIDATE_EMAIL)) {
            return false;
        }
        $headers = 'From: ' . self::FROM . "\r\n" .
            "Content-Type: text/plain; charset=UTF-8\r\n";
        return mail($to, $subject, $body, $headers);
    }
}
