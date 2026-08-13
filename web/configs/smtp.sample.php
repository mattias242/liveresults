<?php
/**
 * SMTP configuration for outgoing admin-login e-mails.
 *
 * Copy this file to smtp.php (which is git-ignored) and fill in the real
 * credentials on the server. If smtp.php is absent, the app falls back to
 * PHP mail(). Never commit real credentials.
 *
 * Example for Mailgun (EU region):
 *   secure 'tls' -> STARTTLS on port 587 (also 25/2525)
 *   secure 'ssl' -> implicit TLS on port 465
 */
return [
    'host'     => 'smtp.eu.mailgun.org',
    'port'     => 587,
    'username' => 'postmaster@your-domain',
    'password' => 'REPLACE_WITH_SMTP_PASSWORD',
    'from'     => 'Liveresultat <liveresultat@your-domain>',
    'secure'   => 'tls',
];
