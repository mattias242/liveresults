# language: en
Feature: One-time-password issue/verify flow
  As the admin login backend
  I must issue a single-use code per e-mail and verify it safely
  So that codes cannot be replayed, brute-forced or used after expiry (S4)

  Scenario: Issuing a code stores only its hash and returns the raw code to send
    When a code is issued for "boss@example.com" at t=1000
    Then a record for "boss@example.com" exists
    And the stored value is a hash, not the raw code

  Scenario: The correct code verifies once and is then consumed
    Given a code was issued for "boss@example.com" at t=1000
    When the correct code is verified at t=1100
    Then verification succeeds
    And verifying the same code again fails (single use)

  Scenario: A wrong code fails and counts against the attempt limit
    Given a code was issued for "boss@example.com" at t=1000
    When a wrong code is submitted 5 times
    Then every attempt fails
    And even the correct code no longer verifies (locked out)

  Scenario: An expired code never verifies
    Given a code was issued for "boss@example.com" at t=1000 with a 300s lifetime
    When the correct code is verified at t=1400
    Then verification fails
