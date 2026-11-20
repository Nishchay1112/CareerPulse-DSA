# CareerPulse — Windows local edition

## Important note about the new interface

This ZIP includes the readability, About You, settings, resources, and topic/daily practice upgrades. Read **CAREERPULSE-V2-CHANGES.md** for features, the browser-only storage limitations, and validation notes. The original Windows backend executable is unchanged and preserved.

## Open your website

1. Extract the entire ZIP, keeping `backend` and `frontend` beside each other.
2. Double-click **OPEN-CAREERPULSE.cmd** in the extracted project folder. It starts the backend if needed, waits for a successful health check, then opens the correct website address.
3. Leave the backend window open while using the website.
4. The website address is **http://127.0.0.1:8081/** in Chrome on your laptop.

The included executable runs on 64-bit Windows. You do not need to compile it. Port 8081 intentionally keeps this new version separate from the earlier PathFinder server on 8080. Do not open index.html directly or use Live Server: the C++ backend serves the website and API together.

Startup correction: the frontend checks API response content types before reading JSON. Local pages accidentally opened through a static preview server or as a file navigate to the backend address instead. Invalid backend responses display instructions rather than a raw JSON parser error. Seven additional connection regression checks passed. You can also launch backend/START-CAREERPULSE.cmd directly, then enter the address above.

Create a fresh CareerPulse account. The earlier PathFinder student records had no passwords or verified identities, so they have not been converted into login accounts. Your earlier files and database have not been changed. This version uses its own `backend/careerpulse.db`.

## OTP and recovery — local testing, as requested

An SMS/email provider has not been connected. You chose to select one later.

Registration shows a clearly labelled **LOCAL TEST CODE** on the verification screen, and prints it in the backend console. Enter that code to test verification. No SMS is sent. Codes expire after 10 minutes, allow five incorrect verification attempts, and support resending after 60 seconds.

Password recovery similarly displays a local recovery code for an existing test account. This is for testing, not genuine proof of phone/email ownership. New passwords invalidate existing login sessions and recovery codes are single-use.

Do not publicly expose local testing mode. The server binds only to your laptop's loopback address. It will not be reachable from other students' computers or Android Emulator in this configuration.

## What is included

- CareerPulse branding: embedded Base64 favicon and full wordmark, with whitespace cropped through CSS and a light backing for visibility in dark theme.
- Login, registration, password strength meter, password visibility controls, OTP verification/resend and password recovery.
- Salted PBKDF2-HMAC-SHA256 password hashes, cryptographically random session tokens, hashed session storage, HttpOnly/SameSite cookies, expiring sessions and basic rate limits.
- Separate page views for personal information, career selection, relevant skill assessment, dashboard, learning checks, practice, daily problems, leaderboard, profile, settings and study materials.
- First-time sequence: register → verify code → personal information → career → relevant skills → dashboard. Unfinished setup resumes after login.
- Dashboard starts with zero recorded activity and completed learning progress. Starting self-assessment is stored separately. Daily learning activity, recorded check-session duration, a completion doughnut and a pace-based remaining-plan estimate are included. Estimates require three completed checks and are indicative only.
- One backend-verified knowledge check per supported skill remains available. The new Study Resources section offers free beginner, guided and advanced links selected from your saved self-assessment level.
- The original six ranked answer-based DSA challenges remain server-validated and feed the college leaderboard. New in this ZIP: 20 practice questions and 20 daily questions across Arrays, Searching, Stacks and Graphs, with browser-only progress (not leaderboard-ranked). No program-code execution judge is included.
- A daily college leaderboard ordered by correct solve count, total elapsed time, then username. Daily attempts reset logically at 00:00 UTC; historical records remain. College names are normalized but self-declared, so rankings are explicitly provisional, not institution-verified.
- Profile page and Settings retain backend-saved name, username, email, phone, college, department, year and career, and now allow updating existing server-saved skill levels. Optional birthday, calculated age, degree and personal goal are browser-only in this release. Email/phone changes still require re-verification.
- Three confirmation dialogs with password re-entry: reset progress, change career/reset progress, and permanent account deletion. Database transactions protect resets. Deletion cascades to account-linked progress and sessions.
- Light and dark themes during a visit. Every page reload or fresh opening starts in light theme; theme choice is not persisted.

## Daily use and data

Keep the backend running while using the website. Closing its console stops the server. STOP-CAREERPULSE.cmd stops only CareerPulse executables running from that same backend folder.

The server creates careerpulse.db in its working directory. The launcher always uses its own backend folder so data stays in a predictable location. Back up this database while the server is stopped. Updating source or the executable should not require deleting it. No test accounts or database are included in the ZIPs.

Reset removes assessments, learning starts/completions and all practice/daily attempts, then returns to the current career's assessment. Change career clears those records and returns to the new career's assessment. Both retain personal/account information. Account deletion permanently removes the account and linked records; exported backups are outside the app's control.

## Verification completed

The actual C++ executable passed 21 integration checks covering authentication protection, password strength rejection, local OTP, resend cooldown, wrong/correct verification codes, onboarding order, saved personal data, career assessment, zero initial progress, origin checks, correct/incorrect learning answers, estimates, hidden challenge answers, persistent timers, leaderboard entries, password-confirmed destructive controls, reset/career changes, password recovery, password hashing, deletion cascades and static assets.

Browser checks confirmed login, dashboard zero states, full wordmark visibility, saved settings details, dark theme, a cancellable career-change dialog, and light theme after reload. These used disposable accounts in a separate test database. Real SMS/email delivery, public hosting, verified college membership and a code-execution judge have not been configured or tested.

## Source build

backend contains main.cpp, CMakeLists.txt and vcpkg.json. The C++17 implementation uses SQLite, cpp-httplib, nlohmann/json, Windows BCrypt and WinHTTP. The executable was built using the working GCC 14.2.0 compiler bundled with Code::Blocks; dependencies are statically linked except standard Windows libraries.

For your existing vcpkg/CMake setup, configure using your installed vcpkg toolchain, build the `careerpulse` target, then launch from the backend directory. The CMake configuration targets Windows because BCrypt and WinHTTP are Windows APIs.

Libraries, versions and licenses are listed in backend/THIRD-PARTY-NOTICES.txt and backend/licenses.

## Connecting real messaging later

The backend supports a delivery adapter through these environment variables, set before launching the server:

- CAREERPULSE_DELIVERY_URL: an HTTPS webhook controlled by your chosen messaging integration.
- CAREERPULSE_DELIVERY_SECRET: a private bearer secret for that webhook; keep it out of source control and frontend files.
- CAREERPULSE_PRODUCTION=1: disables local test-code disclosure and enables Secure cookies. Use HTTPS through an appropriately configured reverse proxy in this mode.
- CAREERPULSE_PORT: optional port override, default 8081.

The webhook receives an authenticated POST with JSON fields `purpose`, `destination`, `code`, and `expiresIn`. Purpose is `phone_verification` for SMS or `password_reset` for email. Recovery uses a one-time code entered on the recovery page. Return a 2xx response only after accepting delivery. Provider keys, sender identity, templates and delivery monitoring belong in that adapter. An SMS-only or email-only provider will need a second service for the other channel. Delivery failures are surfaced as errors; they are not reported as successful sends.

For public use, also configure HTTPS, genuine delivery, verified college membership, a larger problem bank, operational backups and monitoring. This download is a working local project, not an already deployed college service.
