# language: en
Feature: One-time-password primitives for admin login
  As the LiveResults admin area
  I must issue and verify single-use, time-limited codes sent by e-mail
  So that admin pages and write endpoints are no longer unauthenticated (S3/S4/S8)

  The login model chosen by the organiser is "user (e-mail) + one-time
  password by e-mail". These are the pure primitives; storage, e-mail
  delivery and the session are wired on top of them.

  Scenario: A generated code is a fixed-length numeric string
    When a one-time code is generated
    Then it is exactly 6 digits
    And two consecutive codes are not always identical

  Scenario: A code is stored only as a hash and verifies against it
    Given a generated code
    When it is hashed for storage
    Then the hash is not equal to the raw code
    And verifying the correct code against the hash succeeds
    And verifying a wrong code against the hash fails

  Scenario: Verification is tolerant of user formatting
    Given the code "123456"
    When the user submits " 123 456 "
    Then verification succeeds

  Scenario Outline: A code is only valid within its lifetime
    Given a code issued at t=1000 with a 300 second lifetime
    When it is checked at t=<now>
    Then expiry is <expired>

    Examples:
      | now  | expired |
      | 1000 | false   |
      | 1299 | false   |
      | 1300 | false   |
      | 1301 | true    |

  Scenario: An e-mail address is only accepted if it is on the admin allow-list
    Given the admin allow-list contains "boss@example.com"
    Then "boss@example.com" is an allowed admin
    And "BOSS@Example.com" is an allowed admin
    And "intruder@example.com" is not an allowed admin
