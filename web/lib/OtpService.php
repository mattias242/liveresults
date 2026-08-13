<?php

declare(strict_types=1);

require_once __DIR__ . '/Otp.php';
require_once __DIR__ . '/OtpRepository.php';

/**
 * Issue and verify single-use, time-limited login codes (finding S4).
 *
 * Storage is injected (OtpRepository) and the current time is passed in, so
 * the whole flow — single use, attempt limiting and expiry — is deterministic
 * and unit-testable. E-mail delivery is the caller's responsibility: issue()
 * returns the raw code to send.
 */
final class OtpService
{
    public function __construct(
        private OtpRepository $repository,
        private int $ttlSeconds = 300,
        private int $maxAttempts = 5,
    ) {
    }

    /**
     * Create a fresh code for the address, replacing any previous one, and
     * return the raw code for the caller to e-mail.
     */
    public function issue(string $email, int $now): string
    {
        $code = Otp::generateCode();
        $this->repository->save(new OtpRecord(
            email: $email,
            codeHash: Otp::hash($code),
            issuedAt: $now,
            attempts: 0,
        ));
        return $code;
    }

    /**
     * Verify a submitted code. Fails closed on unknown/expired/exhausted
     * challenges. On success the challenge is consumed (single use). A wrong
     * code increments the attempt counter and locks out at maxAttempts.
     */
    public function verify(string $email, string $submittedCode, int $now): bool
    {
        $record = $this->repository->findByEmail($email);
        if ($record === null) {
            return false;
        }

        if (Otp::isExpired($record->issuedAt, $this->ttlSeconds, $now)) {
            $this->repository->delete($email);
            return false;
        }

        if ($record->attempts >= $this->maxAttempts) {
            return false;
        }

        if (Otp::verify($submittedCode, $record->codeHash)) {
            $this->repository->delete($email);
            return true;
        }

        $record->attempts++;
        $this->repository->save($record);
        return false;
    }
}
