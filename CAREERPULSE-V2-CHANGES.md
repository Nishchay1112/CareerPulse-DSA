# CareerPulse — Usability and DSA Practice Upgrade

This is the **updated version of the original CareerPulse ZIP**. The existing compiled Windows C++ backend, authentication, SQLite database logic, login/OTP flows, original six ranked challenges, and leaderboard are preserved. No user database is included or reset by the ZIP.

## Getting started

1. Extract the **entire** ZIP to a folder (do not run from inside the ZIP).
2. Double-click `OPEN-CAREERPULSE.cmd`.
3. Open `http://127.0.0.1:8081/` if your browser does not open automatically.
4. The original backend exe is already included; no reinstall or C++ rebuild is needed for these frontend changes.
5. If replacing an earlier copy, **back up** `backend/careerpulse.db` with the server stopped and retain it in the new `backend` folder.

## Changes based on the 13-point review

1. Larger, better-spaced **About You** form with stronger outlines, improved grouping and contrast.
2. Optional birthday (automatically derived age), degree, optional identity and a personal career goal. Headings, navigation and Settings icon are larger.
3. College and department fields show suggested values as you type; you can enter a college/department not listed.
4. Degree/programme controls the year dropdown, including B.Tech, BCA, M.Tech, MCA, MBA and more.
5. Less compressed heading lettering and softer text appearance.
6. Subtle link, heading and button hover effects; respects reduced-motion system preference.
7. Dashboard activity chart now displays **seven clear labeled daily bars**, including days with no learning checks.
8. Settings includes editable saved skill levels. Saving calls the **existing server-side assessment endpoint**; it does not clear completed learning checks.
9. Existing backend password security rules are preserved. Registration and password recovery now include a **Generate strong password** button, plus a checklist of remaining requirements.
10. **Study Resources** now suggests free learning pages per relevant career skill. A 0–1 level shows beginner content; 2–3 shows guided content; 4–5 shows advanced material. Changing a level updates these recommendations the next time you open Resources.
11. **Practice:** four DSA topics (Arrays, Searching, Stacks, Graphs); five answer-verified questions per topic, **20 total**. Each topic has 2 Easy, 2 Medium, and 1 Hard question. Choose a topic and difficulty, reveal a hint, submit an answer and see an explanation after solving.
12. **Daily Questions:** another 20 questions (5 per topic), with numeric variants changing each UTC day. Daily progress resets automatically each day in this browser. A link to the original **six ranked daily challenges** is also provided.
13. All existing code files and the Windows executable are retained. New frontend files add improvements rather than replacing authentication or the original leaderboard.

## How progress is saved

- **Career, original skill ratings, learning checks, existing six ranked problems, and leaderboard:** unchanged C++/SQLite backend.
- **Birthday, degree, identity and optional personal goal:** browser-only storage on the same device/browser. These optional fields do **not** sync with the SQLite server. Clearing browser storage or changing browsers removes them. Avoid putting sensitive details here on shared devices.
- **New 20-question Practice and 20-question Daily sets:** also browser-only completion, per signed-in account. They do **not** affect backend leaderboard positions, which continue to use the original six ranked server-validated challenges. The guided bank is not a secure code-execution judge: answers are checked in client JavaScript.
- **Original password requirements:** still at least 12 characters containing uppercase, lowercase, number and symbol; the generator makes this easy without weakening account security.

## What remains for a later backend release

To sync the extra profile fields and new 40-question completion across devices, store the additional data in SQLite via new backend APIs and **rebuild the Windows executable**. A future genuine code-submission judge, real OTP delivery, college validation and a 20-question leaderboard would also require backend implementation. These capabilities are **not claimed** by this frontend-compatible release.

## Files added

- `frontend/css/refinements.css` — typography, contrast, spacing, hover effects, question cards and readable chart.
- `frontend/js/enhancements.js` — degree/college/department choices, personal extras, study materials and 40 questions.
- `frontend/js/app-overrides.js` — hooks the enhancements into the original site without changing backend interfaces.

## Verification

- `node --check` passed for all three JavaScript files.
- Chromium UI smoke tests with a simulated existing backend verified the dashboard, About You fields, M.Tech year dropdown, profile editing, saved skill changes, level-matched study materials, 20-question topic filtering, daily 20-question mode, original ranked route, and generated passwords. No page JavaScript errors occurred in that check.
- Windows execution of `careerpulse.exe` **was not directly tested in this environment**. The binary itself was kept unchanged.
