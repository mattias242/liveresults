<?php

declare(strict_types=1);

require_once(__DIR__ . "/../lib/Auth.php");

Auth::start();
Auth::clear($_SESSION);
session_regenerate_id(true);

header('Location: login.php');
exit;
