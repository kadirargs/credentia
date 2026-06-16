$ErrorActionPreference = "SilentlyContinue"

function Stop-PortProcess {
    param([int]$Port)

    $processIds = netstat -ano | Select-String ":$Port" | ForEach-Object {
        $parts = $_.ToString().Trim().Split(" ", [System.StringSplitOptions]::RemoveEmptyEntries)
        if ($parts.Length -ge 5 -and $parts[1] -like "*:$Port") {
            $parts[4]
        }
    } | Select-Object -Unique

    foreach ($processId in $processIds) {
        if ($processId -and $processId -ne "0") {
            Stop-Process -Id ([int]$processId) -Force
        }
    }
}

Stop-PortProcess 8000
Stop-PortProcess 3000

Write-Host "Credentia backend/frontend durduruldu."
