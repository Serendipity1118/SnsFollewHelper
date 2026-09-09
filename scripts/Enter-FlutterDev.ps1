[CmdletBinding()]
param(
    [ValidatePattern('^[D-Zd-z]$')]
    [string]$DriveLetter = 'S'
)

$ErrorActionPreference = 'Stop'
$flutterWorkspace = Split-Path -Parent $PSScriptRoot
$flutterDrive = $DriveLetter.ToUpperInvariant() + ':'
$flutterDriveRoot = $flutterDrive + '\'
$flutterProject = Join-Path $flutterWorkspace 'follow_support_app'

if (-not (Test-Path -LiteralPath (Join-Path $flutterProject 'pubspec.yaml'))) {
    throw 'The Flutter project was not found next to this scripts directory.'
}

if (Test-Path -LiteralPath $flutterDriveRoot) {
    # This repository is a Git worktree. Its .git file identifies the worktree
    # even when it is reached through a substituted drive.
    $flutterSourceGit = Join-Path $flutterWorkspace '.git'
    $flutterDriveGit = Join-Path $flutterDriveRoot '.git'
    if (-not (Test-Path -LiteralPath $flutterSourceGit -PathType Leaf) -or
        -not (Test-Path -LiteralPath $flutterDriveGit -PathType Leaf) -or
        (Get-Content -LiteralPath $flutterSourceGit -Raw) -ne
        (Get-Content -LiteralPath $flutterDriveGit -Raw)) {
        throw "$flutterDrive is already in use. Choose another -DriveLetter."
    }
} else {
    & subst.exe $flutterDrive $flutterWorkspace
    if ($LASTEXITCODE -ne 0) {
        throw "Could not map $flutterDrive to the project workspace."
    }
}

$flutterAndroidSdk = [Environment]::GetEnvironmentVariable('ANDROID_HOME', 'User')
if (-not $flutterAndroidSdk) {
    $flutterAndroidSdk = Join-Path $env:LOCALAPPDATA 'Android\sdk'
}
if (Test-Path -LiteralPath $flutterAndroidSdk) {
    $env:ANDROID_HOME = $flutterAndroidSdk
    foreach ($flutterToolPath in @(
        (Join-Path $flutterAndroidSdk 'platform-tools'),
        (Join-Path $flutterAndroidSdk 'emulator')
    )) {
        if (($env:Path -split ';') -notcontains $flutterToolPath) {
            $env:Path += ';' + $flutterToolPath
        }
    }
}

Set-Location -LiteralPath (Join-Path $flutterDriveRoot 'follow_support_app')
Write-Host "Flutter project: $((Get-Location).Path)"
Write-Host 'Run flutter devices, flutter test, or flutter run -d <device-id>.'
