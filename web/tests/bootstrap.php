<?php

declare(strict_types=1);

/*
 * Test bootstrap. Prefers Composer's autoloader when dependencies are
 * installed (CI), and always makes the app's own lib/ classes available.
 */
$composerAutoload = __DIR__ . '/../vendor/autoload.php';
if (is_file($composerAutoload)) {
    require_once $composerAutoload;
}

spl_autoload_register(static function (string $class): void {
    $file = __DIR__ . '/../lib/' . $class . '.php';
    if (is_file($file)) {
        require_once $file;
    }
});
