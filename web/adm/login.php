<?php

declare(strict_types=1);

/**
 * Admin login via e-mail one-time password (findings S3/S4/S8).
 *
 * Step 1 (POST email): if the address is on the allow-list, issue a code and
 *   e-mail it. The response is identical whether or not the address is known,
 *   to avoid revealing which addresses are admins.
 * Step 2 (POST code):  verify the code; on success establish the session and
 *   redirect to the admin start page.
 */

require_once(__DIR__ . "/../lib/Auth.php");
require_once(__DIR__ . "/../lib/SecurityHeaders.php");
require_once(__DIR__ . "/../lib/AdminConfig.php");
require_once(__DIR__ . "/../lib/Otp.php");
require_once(__DIR__ . "/../lib/OtpService.php");
require_once(__DIR__ . "/../lib/Mailer.php");
require_once(__DIR__ . "/../templates/classEmma.class.php");
require_once(__DIR__ . "/../lib/MysqlOtpRepository.php");

SecurityHeaders::apply(SecurityHeaders::forHtml());
Auth::start();

if (isset($_GET['restart'])) {
    unset($_SESSION['otp_email']);
    header('Location: login.php');
    exit;
}

$ttlMinutes = 5;
$service = new OtpService(new MysqlOtpRepository(), $ttlMinutes * 60, 5);
$notice = '';
$stage = isset($_SESSION['otp_email']) ? 'code' : 'email';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!Auth::checkCsrf($_POST['csrf'] ?? null)) {
        http_response_code(400);
        $notice = 'Ogiltig begäran. Försök igen.';
    } elseif (isset($_POST['email'])) {
        $email = strtolower(trim((string) $_POST['email']));
        if (Otp::isAllowedAdmin($email, AdminConfig::adminEmails())) {
            $code = $service->issue($email, time());
            $msg = Mailer::buildOtpMessage($email, $code, $ttlMinutes);
            Mailer::send($email, $msg['subject'], $msg['body']);
            $_SESSION['otp_email'] = $email;
        }
        // Same message regardless, to avoid address enumeration.
        $notice = 'Om adressen är behörig har en inloggningskod skickats.';
        $stage = 'code';
    } elseif (isset($_POST['code']) && isset($_SESSION['otp_email'])) {
        $email = (string) $_SESSION['otp_email'];
        if ($service->verify($email, (string) $_POST['code'], time())) {
            session_regenerate_id(true);
            Auth::markAuthenticated($_SESSION, $email);
            unset($_SESSION['otp_email']);
            header('Location: admincompetitions.php');
            exit;
        }
        $notice = 'Felaktig eller utgången kod.';
        $stage = 'code';
    }
}

require_once(__DIR__ . "/../lib/Html.php");
$csrf = Auth::csrfToken();
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="sv">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Logga in – Liveresultat admin</title>
<link rel="stylesheet" type="text/css" href="../css/style.css">
</head>
<body>
<h2>Logga in</h2>
<?php if ($notice !== ''): ?><p><?= Html::esc($notice) ?></p><?php endif; ?>
<?php if ($stage === 'email'): ?>
<form method="post" action="login.php">
    <input type="hidden" name="csrf" value="<?= Html::esc($csrf) ?>">
    <label>E-post: <input type="email" name="email" required autofocus></label>
    <button type="submit">Skicka kod</button>
</form>
<?php else: ?>
<form method="post" action="login.php">
    <input type="hidden" name="csrf" value="<?= Html::esc($csrf) ?>">
    <label>Inloggningskod: <input type="text" name="code" inputmode="numeric" pattern="[0-9 ]*" required autofocus></label>
    <button type="submit">Logga in</button>
</form>
<p><a href="login.php?restart=1">Börja om</a></p>
<?php endif; ?>
</body>
</html>
