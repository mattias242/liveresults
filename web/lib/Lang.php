<?php

declare(strict_types=1);

/**
 * Resolves the user-supplied ?lang parameter to a safe language code.
 *
 * The resolved code is interpolated into an include path
 * (templates/emmalang_<code>.php), so it must never be allowed to contain
 * path separators, "..", or any character outside a small whitelist, and it
 * must map to a translation file that actually exists. Anything else falls
 * back to the default language. Closes finding S7 (local file inclusion).
 */
final class Lang
{
    public const DEFAULT_LANG = 'sv';

    /**
     * @param mixed       $requested    Raw request value (e.g. $_GET['lang']).
     * @param string|null $templatesDir Folder holding emmalang_*.php files.
     * @param string      $default      Fallback language code.
     */
    public static function resolve(mixed $requested, ?string $templatesDir = null, string $default = self::DEFAULT_LANG): string
    {
        $templatesDir ??= __DIR__ . '/../templates';

        if (!is_string($requested) || !preg_match('/^[a-z]{2,3}$/', $requested)) {
            return $default;
        }

        if (!is_file($templatesDir . '/emmalang_' . $requested . '.php')) {
            return $default;
        }

        return $requested;
    }
}
