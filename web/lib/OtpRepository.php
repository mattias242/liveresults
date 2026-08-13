<?php

declare(strict_types=1);

require_once __DIR__ . '/Otp.php';

/**
 * A stored one-time-password challenge for a single e-mail address.
 */
final class OtpRecord
{
    public function __construct(
        public string $email,
        public string $codeHash,
        public int $issuedAt,
        public int $attempts = 0,
    ) {
    }
}

/**
 * Persistence contract for OTP challenges. One active record per e-mail.
 */
interface OtpRepository
{
    public function save(OtpRecord $record): void;

    public function findByEmail(string $email): ?OtpRecord;

    public function delete(string $email): void;
}

/**
 * In-memory repository used by the unit tests and any non-persistent context.
 */
final class InMemoryOtpRepository implements OtpRepository
{
    /** @var array<string, OtpRecord> */
    private array $records = [];

    public function save(OtpRecord $record): void
    {
        $this->records[strtolower($record->email)] = $record;
    }

    public function findByEmail(string $email): ?OtpRecord
    {
        return $this->records[strtolower($email)] ?? null;
    }

    public function delete(string $email): void
    {
        unset($this->records[strtolower($email)]);
    }
}
