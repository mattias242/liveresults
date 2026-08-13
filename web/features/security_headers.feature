# language: en
Feature: HTTP security headers
  As the LiveResults web application
  I must send a baseline of security headers on every response
  So that clickjacking, MIME sniffing and referrer leakage are mitigated (finding S10)

  The organiser has confirmed that no third-party site needs to embed the
  viewer in an iframe, so framing is blocked.

  Scenario: HTML responses block framing and MIME sniffing
    When the HTML security headers are built
    Then "X-Frame-Options" is "SAMEORIGIN"
    And "X-Content-Type-Options" is "nosniff"
    And "Referrer-Policy" is set
    And the Content-Security-Policy contains "frame-ancestors 'self'"

  Scenario: JSON/API responses still forbid MIME sniffing
    When the JSON security headers are built
    Then "X-Content-Type-Options" is "nosniff"

  Scenario: A strict transport policy is advertised
    When the HTML security headers are built
    Then "Strict-Transport-Security" includes a max-age
