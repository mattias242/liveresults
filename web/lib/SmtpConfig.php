<?php

declare(strict_types=1);

/**
 * SMTP configuration for outgoing mail (e.g. Mailgun).
 *
 * Loaded from the git-ignored configs/smtp.php so credentials never enter the
 * repository. If the file is absent or incomplete, load()/fromArray() return
 * null and the app falls back to PHP mail().
 */
final class SmtpConfig
{
    public function __construct(
        public string $host,
        public int $port,
        public string $username,
        public string $password,
        public string $from,
        public string $secure = 'tls',
    ) {
    }

    public static function fromArray(array $a): ?self
    {
        foreach (['host', 'port', 'username', 'password', 'from'] as $required) {
            if (!isset($a[$required]) || $a[$required] === '') {
                return null;
            }
        }
        return new self(
            (string) $a['host'],
            (int) $a['port'],
            (string) $a['username'],
            (string) $a['password'],
            (string) $a['from'],
            isset($a['secure']) && $a['secure'] !== '' ? (string) $a['secure'] : 'tls',
        );
    }

    public static function load(?string $file = null): ?self
    {
        $file ??= __DIR__ . '/../configs/smtp.php';
        if (!is_file($file)) {
            return null;
        }
        $data = require $file;
        return is_array($data) ? self::fromArray($data) : null;
    }
}
