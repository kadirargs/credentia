$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir = Join-Path $Root "backend"
$FrontendDir = Join-Path $Root "frontend"
$BackendVenv = Join-Path $BackendDir ".venv"
$BackendPython = Join-Path $BackendVenv "Scripts\python.exe"
$LogDir = Join-Path $Root "logs"

function Normalize-PathEnvironment {
    $pathValue = [System.Environment]::GetEnvironmentVariable("Path", "Process")
    if (-not $pathValue) {
        $pathValue = [System.Environment]::GetEnvironmentVariable("PATH", "Process")
    }

    [System.Environment]::SetEnvironmentVariable("PATH", $null, "Process")
    if ($pathValue) {
        [System.Environment]::SetEnvironmentVariable("Path", $pathValue, "Process")
    }
}

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
            Stop-Process -Id ([int]$processId) -Force -ErrorAction SilentlyContinue
        }
    }
}

function Test-BackendDeps {
    if (-not (Test-Path $BackendPython)) {
        return $false
    }

    & $BackendPython -c "import fastapi, uvicorn, sqlalchemy; from jose import jwt" *> $null
    return ($LASTEXITCODE -eq 0)
}

function New-BackendVenv {
    if (Test-Path $BackendPython) {
        return
    }

    Write-Host "Backend sanal ortami bulunamadi, olusturuluyor..."
    $pyLauncher = Get-Command py -ErrorAction SilentlyContinue
    if ($pyLauncher) {
        & py -3 -m venv $BackendVenv
    }
    else {
        $python = Get-Command python -ErrorAction SilentlyContinue
        if (-not $python) {
            throw "Python bulunamadi. Backend icin Python kurulu olmali."
        }
        & python -m venv $BackendVenv
    }
}

function Install-BackendDeps {
    Write-Host "Backend paketleri kontrol ediliyor..."
    if (Test-BackendDeps) {
        return
    }

    Write-Host "Backend paketleri yukleniyor..."
    & $BackendPython -m pip install --upgrade pip
    & $BackendPython -m pip install -r (Join-Path $BackendDir "requirements.txt")

    if (-not (Test-BackendDeps)) {
        throw "Backend paketleri hazirlanamadi. Ayrinti icin terminal ciktisini kontrol et."
    }
}

function Install-FrontendDeps {
    if (Test-Path (Join-Path $FrontendDir "node_modules")) {
        return
    }

    Write-Host "Frontend paketleri yukleniyor..."
    Push-Location $FrontendDir
    npm install
    Pop-Location
}

function Wait-Url {
    param(
        [string]$Url,
        [int]$Retries = 20
    )

    for ($i = 0; $i -lt $Retries; $i++) {
        try {
            Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2 *> $null
            return $true
        }
        catch {
            Start-Sleep -Seconds 1
        }
    }

    return $false
}

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

Normalize-PathEnvironment
New-BackendVenv
Install-BackendDeps
Install-FrontendDeps

Write-Host "PostgreSQL baslatiliyor..."
Push-Location $Root
docker compose up -d db
if ($LASTEXITCODE -ne 0) {
    Pop-Location
    throw "PostgreSQL baslatilamadi. Docker Desktop calisiyor mu?"
}
Pop-Location

Write-Host "Eski backend/frontend surecleri kapatiliyor..."
Stop-PortProcess 8000
Stop-PortProcess 3000

$BackendOut = Join-Path $LogDir "backend.out.log"
$BackendErr = Join-Path $LogDir "backend.err.log"
$FrontendOut = Join-Path $LogDir "frontend.out.log"
$FrontendErr = Join-Path $LogDir "frontend.err.log"

Write-Host "Backend baslatiliyor..."
Start-Process `
    -FilePath $BackendPython `
    -ArgumentList @("-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000") `
    -WorkingDirectory $BackendDir `
    -WindowStyle Hidden `
    -RedirectStandardOutput $BackendOut `
    -RedirectStandardError $BackendErr

Write-Host "Frontend baslatiliyor..."
Start-Process `
    -FilePath "npm.cmd" `
    -ArgumentList @("run", "dev") `
    -WorkingDirectory $FrontendDir `
    -WindowStyle Hidden `
    -RedirectStandardOutput $FrontendOut `
    -RedirectStandardError $FrontendErr

$backendReady = Wait-Url "http://127.0.0.1:8000/docs" 20
$frontendReady = Wait-Url "http://127.0.0.1:3000" 35

Write-Host ""
Write-Host "Credentia baslatildi."
Write-Host "Frontend: http://localhost:3000"
Write-Host "Backend:  http://localhost:8000/docs"
Write-Host "Loglar:   $LogDir"

if (-not $backendReady) {
    Write-Host "Not: Backend henuz cevap vermedi. $BackendErr dosyasina bakabilirsin."
}

if (-not $frontendReady) {
    Write-Host "Not: Frontend ilk acilista biraz gec hazir olabilir. $FrontendErr dosyasina bakabilirsin."
}
