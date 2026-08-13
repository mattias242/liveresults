# language: en
Feature: Safe reflection of request values into the page
  As the LiveResults viewer page (followfull.php)
  I must escape request-derived values before writing them into HTML/JavaScript
  So that a crafted ?comp/?class/?club value cannot inject script (reflected XSS, finding S6)

  Background:
    Given comp is always a numeric competition id
    And class and club are free-text strings echoed into single-quoted JS literals

  Scenario: A competition id is coerced to an integer
    When comp is "123"
    Then the numeric comp is 123
    And a comp of "1;alert(1)" becomes 1
    And a non-numeric comp becomes 0

  Scenario Outline: A value embedded in a single-quoted JS literal cannot break out
    When the value "<payload>" is escaped for a single-quoted JS string
    Then the result contains no raw "'" that could close the literal
    And the result contains no raw "</script" sequence
    And re-reading the escaped literal yields the original value

    Examples:
      | payload                         |
      | Damer Elit                      |
      | O'Brien AK                      |
      | </script><script>alert(1)      |
      | ');alert(1);//                  |
      | line1\nline2                    |

  Scenario: Non-ASCII names are preserved byte-for-byte
    When a class name with "ö" is escaped for a single-quoted JS string
    Then the underlying bytes are unchanged so display is identical to today

  Scenario: HTML escaping neutralises angle brackets and quotes
    When "<b>&\"'" is HTML-escaped
    Then the result has no raw "<", ">", "\"" or "'"
