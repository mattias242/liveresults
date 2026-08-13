<?php

declare(strict_types=1);

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../lib/Lang.php';

/**
 * Executable specification for features/lang.feature.
 * Guards against LFI via the ?lang parameter (finding S7).
 */
final class LangTest extends TestCase
{
    /** Real translation folder shipped with the app. */
    private string $templatesDir;

    protected function setUp(): void
    {
        $this->templatesDir = __DIR__ . '/../templates';
    }

    public function testKnownLanguageIsHonoured(): void
    {
        self::assertSame('en', Lang::resolve('en', $this->templatesDir));
        self::assertSame('fi', Lang::resolve('fi', $this->templatesDir));
    }

    public function testMissingLanguageFallsBackToDefault(): void
    {
        self::assertSame('sv', Lang::resolve(null, $this->templatesDir));
    }

    public function testEmptyLanguageFallsBackToDefault(): void
    {
        self::assertSame('sv', Lang::resolve('', $this->templatesDir));
    }

    public function testUnknownButWellFormedLanguageFallsBackToDefault(): void
    {
        self::assertSame('sv', Lang::resolve('zz', $this->templatesDir));
    }

    #[DataProvider('maliciousPayloads')]
    public function testPayloadsNeverEscapeTemplateFolder(string $payload): void
    {
        self::assertSame('sv', Lang::resolve($payload, $this->templatesDir));
    }

    public static function maliciousPayloads(): array
    {
        return [
            'unix traversal'       => ['../../../../etc/passwd'],
            'sibling config'       => ['../configs/getConnectionSettings'],
            'mixed traversal'      => ['en/../../../secret'],
            'url-encoded traversal'=> ['..%2f..%2fsecret'],
            'suffix injection'     => ['en.php'],
            'uppercase'            => ['EN'],
            'embedded space'       => ['e n'],
            'null byte'            => ["en\0"],
            'dot'                  => ['.'],
            'slash'                => ['/'],
        ];
    }

    public function testResolvedCodeAlwaysHasBackingTemplateOrIsDefault(): void
    {
        $inputs = ['en', 'sv', 'zz', '../x', '', null, 'fi', 'xx'];
        foreach ($inputs as $in) {
            $code = Lang::resolve($in, $this->templatesDir);
            $ok = ($code === 'sv')
                || is_file($this->templatesDir . '/emmalang_' . $code . '.php');
            self::assertTrue($ok, "resolve() returned unsafe code for input: " . var_export($in, true));
        }
    }

    public function testCustomDefaultIsRespected(): void
    {
        self::assertSame('en', Lang::resolve('nope', $this->templatesDir, 'en'));
    }
}
