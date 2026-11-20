# CareerPulse DSA Practice

CareerPulse is a Windows-based student project with career-planning screens and
DSA practice. The frontend is plain HTML, CSS, and JavaScript. A C++17 backend
uses SQLite for accounts and selected progress.

## Features

- DSA practice and daily question sets for Arrays, Searching, Stacks, and Graphs.
- Career and skill self-assessments, learning checks, and study-resource links.
- Account registration, login, and progress stored in a local SQLite database.

The additional practice and daily question sets check answers in the browser;
they are not a secure code-execution judge and do not count toward the original
server-side leaderboard.

## Project layout

- `frontend/` — HTML, stylesheets, and browser-side JavaScript.
- `backend/main.cpp` — C++ API and SQLite setup.
- `backend/CMakeLists.txt` and `backend/vcpkg.json` — build configuration and
  C++ dependencies.

## Build and run on Windows

The backend uses Windows BCrypt and WinHTTP APIs. Install CMake, a C++17
compiler, and vcpkg, then set `VCPKG_ROOT` to your vcpkg installation.

From the project directory, configure and build:

```powershell
cmake -S backend -B backend/build `
  -DCMAKE_TOOLCHAIN_FILE="$env:VCPKG_ROOT/scripts/buildsystems/vcpkg.cmake"
cmake --build backend/build --config Release
```

Copy the resulting `careerpulse.exe` from `backend/build` (or its `Release`
subdirectory) into `backend/`, then run `backend/START-CAREERPULSE.cmd`.
The backend serves the frontend at <http://127.0.0.1:8081/> and creates
`backend/careerpulse.db` on first run. Stop the server before backing up or
moving that database.

In the default local development mode, verification and recovery codes are
shown in the browser and backend console; no SMS or email is sent. The server
binds to this computer's loopback interface. This setup is for local evaluation,
not public hosting.

## Repository contents

The local SQLite database, compiled executable, generated build files, and
machine-specific VS Code settings are intentionally excluded. Each evaluator
should build the backend and use their own local database.
