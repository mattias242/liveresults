<?php

declare(strict_types=1);

require_once __DIR__ . '/SmtpConfig.php';

/** A way to deliver a plaintext e-mail. */
interface MailTransport
{
    public function send(string $to, string $subject, string $body): bool;
}

/** Delivery via PHP's built-in mail() (needs a local MTA). */
final class PhpMailTransport implements MailTransport
{
    public function __construct(private string $from = 'no-reply@liveresultat.orientering.se')
    {
    }

    public function send(string $to, string $subject, string $body): bool
    {
        if (!filter_var($to, FILTER_VALIDATE_EMAIL)) {
            return false;
        }
        $headers = 'From: ' . $this->from . "\r\n" . "Content-Type: text/plain; charset=UTF-8\r\n";
        return mail($to, $subject, $body, $headers);
    }
}

/**
 * Delivery via authenticated SMTP (Mailgun) using PHPMailer.
 *
 * PHPMailer is referenced only inside send(), so unit tests that don't send
 * do not require the vendor autoloader to be present.
 */
final class SmtpTransport implements MailTransport
{
    public function __construct(private SmtpConfig $config)
    {
    }

    public function send(string $to, string $subject, string $body): bool
    {
        if (!filter_var($to, FILTER_VALIDATE_EMAIL)) {
            return false;
        }
        if (!class_exists(\PHPMailer\PHPMailer\PHPMailer::class)) {
            error_log('SmtpTransport: PHPMailer not installed (run composer install)');
            return false;
        }

        $mail = new \PHPMailer\PHPMailer\PHPMailer(true);
        try {
            $mail->isSMTP();
            $mail->Host = $this->config->host;
            $mail->SMTPAuth = true;
            $mail->Username = $this->config->username;
            $mail->Password = $this->config->password;
            $mail->Port = $this->config->port;
            if ($this->config->secure === 'ssl') {
                $mail->SMTPSecure = \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS;
            } elseif ($this->config->secure === 'tls') {
                $mail->SMTPSecure = \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
            }
            $mail->CharSet = 'UTF-8';
            $mail->setFrom($this->config->from);
            $mail->addAddress($to);
            $mail->Subject = $subject;
            $mail->Body = $body;
            $mail->send();
            return true;
        } catch (\Throwable $e) {
            error_log('SmtpTransport send failed: ' . $e->getMessage());
            return false;
        }
    }
}
