<?php

declare(strict_types=1);

use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../lib/OtpRepository.php';
require_once __DIR__ . '/../lib/OtpService.php';

/** Executable specification for features/otp_service.feature (S4). */
final class OtpServiceTest extends TestCase
{
    private InMemoryOtpRepository $repo;
    private OtpService $service;

    protected function setUp(): void
    {
        $this->repo = new InMemoryOtpRepository();
        // 300s lifetime, max 5 attempts.
        $this->service = new OtpService($this->repo, 300, 5);
    }

    public function testIssueStoresHashAndReturnsRawCode(): void
    {
        $code = $this->service->issue('boss@example.com', 1000);
        self::assertMatchesRegularExpression('/^\d{6}$/', $code);

        $record = $this->repo->findByEmail('boss@example.com');
        self::assertNotNull($record);
        self::assertNotSame($code, $record->codeHash);
        self::assertTrue(Otp::verify($code, $record->codeHash));
    }

    public function testCorrectCodeVerifiesOnceThenConsumed(): void
    {
        $code = $this->service->issue('boss@example.com', 1000);
        self::assertTrue($this->service->verify('boss@example.com', $code, 1100));
        // Single use: the record is gone.
        self::assertFalse($this->service->verify('boss@example.com', $code, 1101));
        self::assertNull($this->repo->findByEmail('boss@example.com'));
    }

    public function testWrongCodeCountsAndLocksOut(): void
    {
        $code = $this->service->issue('boss@example.com', 1000);
        for ($i = 0; $i < 5; $i++) {
            self::assertFalse($this->service->verify('boss@example.com', '000000', 1100 + $i));
        }
        // Correct code is now rejected: attempts exhausted.
        self::assertFalse($this->service->verify('boss@example.com', $code, 1200));
    }

    public function testExpiredCodeNeverVerifies(): void
    {
        $code = $this->service->issue('boss@example.com', 1000);
        self::assertFalse($this->service->verify('boss@example.com', $code, 1400));
    }

    public function testUnknownEmailFailsClosed(): void
    {
        self::assertFalse($this->service->verify('nobody@example.com', '123456', 1000));
    }

    public function testIssuingReplacesPreviousCode(): void
    {
        $first = $this->service->issue('boss@example.com', 1000);
        $second = $this->service->issue('boss@example.com', 1005);
        // Old code must no longer work once a new one is issued.
        self::assertFalse($this->service->verify('boss@example.com', $first, 1010));
        self::assertTrue($this->service->verify('boss@example.com', $second, 1010));
    }
}
