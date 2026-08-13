# language: en
Feature: CSRF tokens and admin session state
  As the LiveResults admin area
  I must issue unguessable CSRF tokens and recognise an authenticated session
  So that state-changing admin/write requests cannot be forged (finding S4)

  Scenario: CSRF tokens are long, random and unique
    When two CSRF tokens are generated
    Then each token is at least 32 hex characters
    And the two tokens differ

  Scenario: CSRF validation is exact and constant-time
    Given a stored token
    Then submitting the same token validates
    And submitting a different token does not validate
    And submitting an empty or missing token does not validate

  Scenario: A session is authenticated only when explicitly marked
    Given an empty session
    Then it is not authenticated
    When the session is marked authenticated for "boss@example.com"
    Then it is authenticated
    And the authenticated admin e-mail is "boss@example.com"
