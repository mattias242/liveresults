# AGENTS.md

Guidance for AI agents (and humans) working in this repository.

## What this project is

**LiveResults / EmmaClient** is a client–server system for publishing live results
from orienteering events (used at WOC/EOC and 500+ events since 2006). Two tiers:

- **C# / .NET client** (`LiveResults.Client`, `LiveResults.Model`, `WOCEmmaClient`, …):
  reads results from timing systems (OE2010, IOF-XML, MeOS, OLA, SSFTiming, …) and
  **writes directly into the production MySQL database** (there is no write API yet).
- **PHP web tier** (`web/`): a read-only JSON API (`web/api.php`) plus server-rendered
  pages (`web/index.php`, `web/followfull.php`, `web/adm/*`), and — since the 2026
  modernization — a **new React SPA** (`web/spa/`) and a **PHP library layer**
  (`web/lib/`).

The public site had been frozen since ~2018 (jQuery 1.7.2, hand-concatenated JSON,
no build system, no auth). A modernization is under way, done in small BDD/TDD
slices.

## Working conventions (follow these)

This repo is developed **BDD-first, TDD-driven, one feature at a time**:

1. **Document the behaviour first.** For PHP, add a Gherkin `.feature` under
   `web/features/` (executable spec is the matching PHPUnit test). For the SPA, the
   Vitest `describe/it` blocks are the spec.
2. **Red → Green → Refactor.** Write a failing test, make it pass with the smallest
   change, then refactor with tests green.
3. **Commit on every green.** Small, descriptive commits. Don't batch unrelated work.
4. **One feature at a time.** Finish (all tests green + committed) before starting the
   next. Each feature is typically its own PR (draft).
5. **Never commit secrets.** Real credentials live only in git-ignored config files
   (see below); commit `*.sample.php` templates instead.

Commit trailer convention used so far:
```
Co-Authored-By: Claude <noreply@anthropic.com>
```

## Layout

```
web/
  api.php                 # the entire read-only JSON API (legacy, string-built JSON)
  index.php               # competition list (legacy server-rendered)
  followfull.php          # legacy live-results page (jQuery); to be replaced by the SPA
  adm/                    # admin pages — now behind Auth::requireAdmin() + CSRF
  templates/classEmma.class.php   # mysqli data layer (legacy; still string-interpolated SQL)
  lib/                    # NEW PHP library layer (small single-purpose classes, unit-tested)
  configs/                # config; *.sample.php committed, real files git-ignored
  features/               # Gherkin BDD specs for the PHP tier
  tests/                  # PHPUnit tests (+ bootstrap.php)
  composer.json / phpunit.xml / Makefile
  ci/web-tests.yml.example   # GitHub Actions workflow (copy into .github/workflows/)
  spa/                    # NEW React 19 + Vite + Vitest SPA
    src/domain/           # pure, characterized logic: time.ts, ranking.ts
    src/api/              # types.ts + client.ts (typed client for api.php / /api/v1)
    src/state/            # polling controllers (classes, results, club, lastPassings)
    src/i18n/             # message catalog (sv default, en fallback)
    src/ui/               # React components (App, ClassList, ResultsTable, ClubResults, LastPassings)
```

## How to build & test

**PHP tier** (PHP 8.1+, Composer):
```bash
cd web
composer install          # or: make install   (installs PHPUnit + PHPMailer)
make test                 # vendor/bin/phpunit  — 70 tests
make lint                 # php -l over all sources
```
Note: `composer install` can be slow behind a proxy. A standalone
`phpunit.phar` also works if Composer is unavailable.

**SPA** (Node 22):
```bash
cd web/spa
npm ci
npm test                  # vitest run — 61 tests
npm run typecheck         # tsc --noEmit
npm run build             # tsc && vite build  (~64 KB gzip)
npm run dev               # local dev server
```

**CI:** `web/ci/web-tests.yml.example` runs both suites. It lives outside
`.github/workflows/` because the automation account lacks the GitHub `workflows`
permission — a human must copy it to `.github/workflows/web-tests.yml`.

## Git-ignored config files (must be created on each machine/server)

These are **not** in git by design. Create them from the committed `*.sample.php`:

| File | Purpose |
|------|---------|
| `web/configs/smtp.php` | SMTP creds for admin-login e-mail (Mailgun). Falls back to `mail()` if absent. |
| `web/configs/admins.php` | Allow-list of admin e-mail addresses (fail-closed: empty = nobody can log in). |
| `web/vendor/`, `web/spa/node_modules/` | Installed via `composer install` / `npm ci`. |

## What has been done (2026 modernization, merged in PR #1)

Security hardening of the PHP tier (findings labelled S1–S10 from the review):

- **S7 LFI** — `?lang` is validated by `web/lib/Lang.php` before being used in an
  `include` path; wired into every entry point.
- **S6 reflected XSS** — `followfull.php` casts `?comp` to int and escapes
  `?class`/`?club` via `web/lib/Html.php` (`jsSingleQuoted`, byte-preserving,
  `</script>`- and U+2028/2029-safe).
- **S10 headers** — `web/lib/SecurityHeaders.php` sends `X-Frame-Options: SAMEORIGIN`
  (framing intentionally blocked), CSP `frame-ancestors 'self'`, `nosniff`,
  `Referrer-Policy`, HSTS on every entry point.
- **S3/S4/S8 auth** — e-mail one-time-password login (`Otp`, `OtpService`,
  `OtpRepository`/`MysqlOtpRepository`, `Csrf`, `Auth`, `AdminConfig`, `Mailer` +
  `MailTransport`/`SmtpConfig`). `adm/login.php`/`logout.php`; `Auth::requireAdmin()`
  + CSRF guard admin pages and the write methods in `api.php`. Codes are single-use,
  time-limited, attempt-limited; passwords never stored raw. Requires the `admin_otp`
  table (DDL in `web/dbupgrade/dbmodelupdates.txt`).
- **SMTP transport** — `Mailer::send()` uses PHPMailer/Mailgun when `configs/smtp.php`
  is present, else `mail()`.

New **React SPA** (`web/spa/`), built against the existing JSON contract:

- Pure, **characterized** domain logic ported verbatim from the legacy
  `js/LiveResults.ts`: time formatting (`domain/time.ts`) and the provisional
  mid-course ranking incl. mass-start & split-place tie-breaks (`domain/ranking.ts`).
- Typed API client (`api/client.ts`) preserving the `last_hash`/"NOT MODIFIED"
  conditional-GET scheme; defaults to an `/api/v1` base but works against `api.php`.
- Polling controllers with diff-on-NOT-MODIFIED (no full table rebuild).
- Views: class list, results table (split columns + places, mass-start badge,
  multi-day total column), club view, last-passings feed; `#class` and `#club::`
  hash routing for shareable links; mobile-first responsive CSS; i18n (sv/en).

## Remaining work / roadmap

- **S5/S9** — replace string-interpolated SQL in `web/templates/classEmma.class.php`
  with prepared statements and stop leaking `mysqli_error` to clients. Needs a live
  (test) DB to verify bind types/behaviour. Add golden-master characterization tests
  for `api.php` first (Fas 1).
- **S1/S2** — retire `web/configs/getConnectionSettings.php` (it hands out production
  DB credentials for a hardcoded shared key), introduce an authenticated per-competition
  **write API** to replace direct-MySQL ingest, and enable TLS on the C# client's MySQL
  connection. Requires C# changes + secret rotation.
- **API v1** — freeze the current wire contract behind `/api/v1/` (byte-compatible,
  third parties consume it) and replace the hand-built JSON in `api.php` with
  `json_encode` behind golden-master tests.
- **SPA rollout** — serve the SPA as the real page in place of `followfull.php`,
  preserving old URLs (`?comp=&class=`, `#Class`, `#club::Club`).

## Gotchas / things to know

- **Legacy `api.php` builds JSON by string concatenation** — it has known malformed-JSON
  spots and unescaped runner names. Don't extend that style; move logic behind
  `/api/v1` with `json_encode` (with characterization tests first).
- **`followfull.php` uses `utf8_decode()`** on `?club` (deprecated PHP 8.2+, produces
  Latin-1). Behaviour was intentionally preserved during the XSS fix; revisit when the
  SPA replaces the page.
- **The C# client writes straight to MySQL** — there is no HTTP write path to reuse.
- **`configs/getConnectionSettings.php`** and the hardcoded DB creds in
  `classEmma.class.php` are known critical issues (S1) still pending.
- **Composer/npm through the proxy can be slow**; prefer `npm ci` and cached CI.
- **Times are centiseconds** throughout the API and domain logic. Status codes:
  0 OK, 1 DNS, 2 DNF, 3 MP, 4 DSQ, 5 OT, 9 not-started, 10 blank, 11 w/o, 12 moved-up.
