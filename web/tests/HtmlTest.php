<?php

declare(strict_types=1);

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../lib/Html.php';

/**
 * Executable specification for features/output_escaping.feature.
 * Guards against reflected XSS via ?comp/?class/?club (finding S6).
 */
final class HtmlTest extends TestCase
{
    public function testHtmlEscapeNeutralisesDangerousChars(): void
    {
        $out = Html::esc('<b>&"\'');
        self::assertStringNotContainsString('<', $out);
        self::assertStringNotContainsString('>', $out);
        self::assertStringNotContainsString('"', $out);
        self::assertStringNotContainsString("'", $out);
    }

    #[DataProvider('jsPayloads')]
    public function testJsSingleQuotedCannotBreakOut(string $payload): void
    {
        $escaped = Html::jsSingleQuoted($payload);

        // No raw single quote may remain that could close the '...' literal.
        self::assertSame(0, preg_match('/(?<!\\\\)\'/', $escaped), "unescaped quote in: $escaped");
        // No raw </script (case-insensitive) that could break out of the block.
        self::assertStringNotContainsStringIgnoringCase('</script', $escaped);
        // No raw closing angle bracket.
        self::assertStringNotContainsString('<', $escaped);
        self::assertStringNotContainsString('>', $escaped);
    }

    public static function jsPayloads(): array
    {
        return [
            'plain'        => ['Damer Elit'],
            'apostrophe'   => ["O'Brien AK"],
            'script close' => ['</script><script>alert(1)'],
            'quote break'  => ["');alert(1);//"],
            'newline'      => ["line1\nline2"],
            'backslash'    => ['a\\b'],
            'amp'          => ['A & B'],
        ];
    }

    #[DataProvider('roundtripPayloads')]
    public function testJsSingleQuotedRoundtripsThroughJsSemantics(string $payload): void
    {
        // Emulate how a JS engine reads the single-quoted literal we produced,
        // to prove the escaping is lossless.
        $escaped = Html::jsSingleQuoted($payload);
        self::assertSame($payload, self::decodeJsSingleQuoted($escaped));
    }

    public static function roundtripPayloads(): array
    {
        return [
            'plain'      => ['Damer Elit'],
            'apostrophe' => ["O'Brien AK"],
            'newline'    => ["line1\nline2"],
            'tab'        => ["a\tb"],
            'backslash'  => ['a\\b'],
            'angles'     => ['<b>'],
            'amp'        => ['A & B'],
            'quote'      => ['say "hi"'],
        ];
    }

    public function testNonAsciiBytesPreserved(): void
    {
        $name = "Herrar \xC3\xB6"; // "Herrar ö" in UTF-8
        $escaped = Html::jsSingleQuoted($name);
        // High bytes must survive unchanged so on-page display is identical.
        self::assertStringContainsString("\xC3\xB6", $escaped);
    }

    /** Minimal JS single-quoted-string decoder for the escapes we emit. */
    private static function decodeJsSingleQuoted(string $s): string
    {
        $map = [
            '\\\\' => "\\",
            "\\'"  => "'",
            '\\"'  => '"',
            '\\n'  => "\n",
            '\\r'  => "\r",
            '\\t'  => "\t",
            '\\x3C' => '<',
            '\\x3E' => '>',
            '\\x26' => '&',
        ];
        return strtr($s, $map);
    }
}
