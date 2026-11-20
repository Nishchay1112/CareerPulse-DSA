param([Parameter(Mandatory = $true)][string]$ExpectedExe)
# 0: This backend already listens; 1: no backend listens; 2: another application listens.
try {
    $listening = @(Get-NetTCPConnection -LocalPort 8081 -State Listen -ErrorAction SilentlyContinue)
    if ($listening.Count -eq 0) { exit 1 }
    $expected = [System.IO.Path]::GetFullPath($ExpectedExe)
    foreach ($entry in $listening) {
        $p = Get-CimInstance Win32_Process -Filter "ProcessId=$($entry.OwningProcess)" -ErrorAction Stop
        if (-not $p -or -not $p.ExecutablePath) { throw 'Unable to identify the process listening on port 8081.' }
        $actual = [System.IO.Path]::GetFullPath($p.ExecutablePath)
        if (-not [string]::Equals($expected, $actual, [StringComparison]::OrdinalIgnoreCase)) {
            Write-Host "Port 8081 is already used by: $actual" -ForegroundColor Yellow
            Write-Host 'Close the other CareerPulse or application before starting this project.'
            Write-Host 'Otherwise, you might sign into the WRONG account database.'
            exit 2
        }
    }
    exit 0
} catch {
    Write-Host "Cannot confirm the server on port 8081: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host 'Please close any older CareerPulse server windows and retry.'
    exit 2
}
