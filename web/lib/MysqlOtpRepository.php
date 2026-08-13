<?php

declare(strict_types=1);

require_once __DIR__ . '/OtpRepository.php';

/**
 * MySQL-backed OTP store using prepared statements (findings S4/S5).
 *
 * Reuses the Emma DB credentials. Requires the admin_otp table (see
 * web/dbupgrade/dbmodelupdates.txt). Verified in staging; the pure flow is
 * covered by OtpServiceTest via InMemoryOtpRepository.
 */
final class MysqlOtpRepository implements OtpRepository
{
    private mysqli $conn;

    public function __construct(?mysqli $conn = null)
    {
        if ($conn !== null) {
            $this->conn = $conn;
            return;
        }
        $this->conn = mysqli_connect(
            Emma::$db_server,
            Emma::$db_user,
            Emma::$db_pw,
            Emma::$db_database
        );
        mysqli_set_charset($this->conn, Emma::$MYSQL_CHARSET);
    }

    public function save(OtpRecord $record): void
    {
        $email = strtolower(trim($record->email));
        $stmt = $this->conn->prepare(
            'REPLACE INTO admin_otp (email, code_hash, issued_at, attempts) VALUES (?, ?, ?, ?)'
        );
        $stmt->bind_param('ssii', $email, $record->codeHash, $record->issuedAt, $record->attempts);
        $stmt->execute();
        $stmt->close();
    }

    public function findByEmail(string $email): ?OtpRecord
    {
        $email = strtolower(trim($email));
        $stmt = $this->conn->prepare(
            'SELECT email, code_hash, issued_at, attempts FROM admin_otp WHERE email = ?'
        );
        $stmt->bind_param('s', $email);
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result ? $result->fetch_assoc() : null;
        $stmt->close();

        if (!$row) {
            return null;
        }
        return new OtpRecord(
            email: (string) $row['email'],
            codeHash: (string) $row['code_hash'],
            issuedAt: (int) $row['issued_at'],
            attempts: (int) $row['attempts'],
        );
    }

    public function delete(string $email): void
    {
        $email = strtolower(trim($email));
        $stmt = $this->conn->prepare('DELETE FROM admin_otp WHERE email = ?');
        $stmt->bind_param('s', $email);
        $stmt->execute();
        $stmt->close();
    }
}
