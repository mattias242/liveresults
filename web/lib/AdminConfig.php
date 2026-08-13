<?php

declare(strict_types=1);

/**
 * Loads the admin allow-list (finding S4). Returns the addresses from
 * configs/admins.php, or an empty list if it has not been created yet
 * (fail-closed: nobody can log in until configured).
 */
final class AdminConfig
{
    /** @return string[] */
    public static function adminEmails(): array
    {
        $file = __DIR__ . '/../configs/admins.php';
        if (!is_file($file)) {
            return [];
        }
        $list = require $file;
        return is_array($list) ? array_values(array_filter(array_map('strval', $list))) : [];
    }
}
