# language: en
Feature: Safe language selection
  As the LiveResults web application
  I must resolve the requested ?lang parameter to a known language
  So that a crafted value can never be used to include arbitrary files (LFI, finding S7)

  The value is used to build an include path: templates/emmalang_<lang>.php.
  Only codes that map to an existing translation file may be honoured; anything
  else must silently fall back to the default language.

  Scenario: A known language is honoured
    Given the translation "emmalang_en.php" exists
    When the requested language is "en"
    Then the resolved language is "en"

  Scenario: Missing language falls back to the default
    When no language is requested
    Then the resolved language is the default "sv"

  Scenario: Empty language falls back to the default
    When the requested language is ""
    Then the resolved language is the default "sv"

  Scenario: An unknown but well-formed language falls back to the default
    Given no translation "emmalang_zz.php" exists
    When the requested language is "zz"
    Then the resolved language is the default "sv"

  Scenario Outline: A path-traversal or injection payload never escapes the template folder
    When the requested language is "<payload>"
    Then the resolved language is the default "sv"

    Examples:
      | payload                          |
      | ../../../../etc/passwd           |
      | ../configs/getConnectionSettings |
      | en/../../../secret               |
      | ..%2f..%2fsecret                 |
      | en.php                           |
      | EN                               |
      | e n                              |
      | en\0                             |

  Scenario: The resolver never returns a code without a backing template file
    When any language is resolved
    Then the returned code always has an existing templates/emmalang_<code>.php file or equals the default
