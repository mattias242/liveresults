<?php

declare(strict_types=1);

/**
 * Output-encoding helpers for reflecting request-derived values into the page.
 *
 * Closes finding S6 (reflected XSS). The escapers are byte-preserving: only
 * the characters that are dangerous in the target context are rewritten, so
 * non-ASCII names (UTF-8 or the legacy Latin-1 produced by utf8_decode) render
 * exactly as they do today.
 */
final class Html
{
    /** Escape a value for HTML text or a double/single-quoted attribute. */
    public static function esc(mixed $value): string
    {
        return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }

    /**
     * Escape a value for placement inside a single-quoted JavaScript string
     * literal, e.g. res.chooseClass('<HERE>'). Returns the escaped content
     * only (no surrounding quotes). Also neutralises the "</script>" breakout
     * and the JS line terminators U+2028/U+2029.
     */
    public static function jsSingleQuoted(mixed $value): string
    {
        return strtr((string) $value, [
            '\\'         => '\\\\',
            "'"          => "\\'",
            '"'          => '\\"',
            '<'          => '\\x3C',
            '>'          => '\\x3E',
            '&'          => '\\x26',
            "\r"         => '\\r',
            "\n"         => '\\n',
            "\t"         => '\\t',
            "\xE2\x80\xA8" => '\\u2028', // U+2028 line separator
            "\xE2\x80\xA9" => '\\u2029', // U+2029 paragraph separator
        ]);
    }
}
