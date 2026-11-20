# CareerPulse — Fix incorrect email/username or password

This project uses a **local SQLite database**: `backend/careerpulse.db`. Passwords are verified using salted PBKDF2 hashes in that local database. Unzipping a fresh project does **not** transfer registered accounts from another folder.

## Restore your original account without resetting passwords

1. **Close all CareerPulse backend windows**, including the old version.
2. Locate the older project folder where you originally registered. The account file is `OLD-FOLDER\backend\careerpulse.db` (NOT `main.cpp` or the ZIP).
3. Extract this updated ZIP fully. Double-click **`RESTORE-OLD-ACCOUNT.cmd`**.
4. Choose the **old** `careerpulse.db` using the file picker and type `RESTORE` to confirm.
5. The tool backs up any current new-installation database, then copies your selected old database. Start **`OPEN-CAREERPULSE.cmd`** and log in with your existing email and password.

If you have newly registered another account in the new folder, it will stay in a timestamped `backend\careerpulse.db.backup-...` file, not merged with the old records. The original old database stays untouched. Do not restore from a database belonging to a different application. The tool refuses a database with an active SQLite WAL journal; close the original program cleanly first.

If you **cannot find an old `careerpulse.db`**: the original login cannot be restored from the ZIP alone. Use **Forgot password** only if your account is present in this installation, or create a new account. In local testing mode, the recovery code appears on the website instead of being emailed. If registration was started but phone verification never completed, the account may not exist yet; register and verify it.

## If login still fails

- Use the exact username or email originally registered (case-insensitive) and the exact password (case-sensitive).
- Open the app through `OPEN-CAREERPULSE.cmd`, not `index.html` or Live Server. The address is `http://127.0.0.1:8081/`.
- Close other CareerPulse server windows. The launcher now checks that port 8081 belongs to this folder's `careerpulse.exe`; it will refuse to connect to the wrong running server.
- **Never delete `careerpulse.db`** to fix a login problem; it contains your accounts and progress. Make backups while the app is stopped.

## What's changed in this release

- Added a safe, explicit old-account database restore assistant with backups.
- Added a port ownership check to prevent the launcher from opening another CareerPulse installation's backend.
- Updated incorrect-credentials guidance without weakening password checking or disclosing whether a specific email exists.
- All CareerPulse v2 UI features and the existing C++ executable remain unchanged.
