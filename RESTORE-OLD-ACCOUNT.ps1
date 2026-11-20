# Copies an existing CareerPulse account database into this project.
# No password is requested, exposed, or modified.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$target = Join-Path $root 'backend\careerpulse.db'

function Finish($message, $code) {
    Write-Host "`n$message"
    exit $code
}

try {
    Write-Host 'CareerPulse account recovery: restore your previous database.'
    Write-Host 'The original and updated servers must both be fully closed.'
    $running = @(Get-Process -Name 'careerpulse' -ErrorAction SilentlyContinue)
    if ($running.Count -gt 0) {
        Finish 'Close all CareerPulse backend windows and try again. No files were changed.' 2
    }

    Add-Type -AssemblyName System.Windows.Forms
    $dialog = New-Object System.Windows.Forms.OpenFileDialog
    $dialog.Title = 'Select your OLD CareerPulse backend\careerpulse.db file'
    $dialog.Filter = 'CareerPulse database (careerpulse.db)|careerpulse.db|SQLite databases (*.db)|*.db'
    $dialog.CheckFileExists = $true
    $dialog.Multiselect = $false
    if ($dialog.ShowDialog() -ne [System.Windows.Forms.DialogResult]::OK) {
        Finish 'Cancelled. No files were changed.' 0
    }
    $source = [System.IO.Path]::GetFullPath($dialog.FileName)
    $dest = [System.IO.Path]::GetFullPath($target)
    if ([string]::Equals($source, $dest, [StringComparison]::OrdinalIgnoreCase)) {
        Finish 'You selected the database already used by this installation. No copy is needed.' 0
    }
    if (([System.IO.Path]::GetFileName($source)) -ne 'careerpulse.db') {
        Finish 'Please choose the old CareerPulse file named careerpulse.db.' 2
    }
    $stream = [System.IO.File]::Open($source, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::Read)
    try {
        $header = New-Object byte[] 16
        if ($stream.Read($header, 0, 16) -ne 16 -or [Text.Encoding]::ASCII.GetString($header) -ne "SQLite format 3`0") {
            Finish 'The selected file is not a valid SQLite database. No files were changed.' 2
        }
    } finally { $stream.Dispose() }

    foreach ($dbFile in @($source, $dest)) {
        if (Test-Path -LiteralPath ($dbFile + '-wal')) {
            if ((Get-Item -LiteralPath ($dbFile + '-wal')).Length -gt 0) {
                Finish "Database has a pending -wal journal: $dbFile. Close its application cleanly and retry. No files were changed." 2
            }
        }
    }

    Write-Host "`nOLD account database: $source"
    Write-Host "NEW installation database: $dest"
    if (Test-Path -LiteralPath $dest) {
        Write-Warning 'The NEW installation already has a database. It will be backed up before the old database replaces it.'
        Write-Warning 'Accounts created in the NEW database will not be merged automatically.'
    }
    $answer = Read-Host 'Type RESTORE to confirm (anything else cancels)'
    if ($answer -cne 'RESTORE') { Finish 'Cancelled. No files were changed.' 0 }

    if (Test-Path -LiteralPath $dest) {
        $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
        $backup = $dest + '.backup-' + $stamp
        $suffix = 1
        while (Test-Path -LiteralPath $backup) { $backup = $dest + '.backup-' + $stamp + '-' + $suffix; $suffix++ }
        Copy-Item -LiteralPath $dest -Destination $backup -ErrorAction Stop
        Write-Host "Existing NEW database backed up to: $backup"
    }

    $tempFile = $dest + '.restore-tmp'
    Copy-Item -LiteralPath $source -Destination $tempFile -ErrorAction Stop
    try {
        Move-Item -LiteralPath $tempFile -Destination $dest -Force -ErrorAction Stop
    } catch {
        Remove-Item -LiteralPath $tempFile -ErrorAction SilentlyContinue
        throw
    }
    Write-Host "`nRestore successful. Your previous account records are now in this installation."
    Write-Host 'Double-click OPEN-CAREERPULSE.cmd and sign in with your previous email and password.'
    exit 0
} catch {
    Write-Host "`nRestore stopped: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host 'No existing database backups were deleted.'
    exit 1
}
