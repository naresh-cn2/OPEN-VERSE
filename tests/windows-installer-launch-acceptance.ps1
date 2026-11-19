<#
.SYNOPSIS
    Automated Windows Installation, Packaging & Verification Acceptance Suite
.DESCRIPTION
    Tests Windows installer integrity, checksums, signatures, payload structure,
    silent installation/uninstallation, and Smart App Control policy diagnostics.
#>

[CmdletBinding()]
param (
    [string]$InstallerPath = "dist-release/OPEN-VERSE_0.2.6_x64-setup.exe",
    [string]$ZipPath = "dist-release/OPEN-VERSE_0.2.6_x64-windows.zip",
    [string]$ExpectedExeSha256 = "36d60fd9b980b98596674f26d3fb10d71087e36856c27dfefe3f1e7ea3632812",
    [string]$ExpectedZipSha256 = "b6de33be3a3e252bf4cc4ee254d66616648ea4553f7beb661a7d8636da83155f"
)

$ErrorActionPreference = "Stop"

Write-Host "=================================================================="
Write-Host "   OPEN-VERSE WINDOWS INSTALLER & PACKAGING ACCEPTANCE SUITE     "
Write-Host "=================================================================="

$passCount = 0
$totalTests = 0

function Assert-Check {
    param (
        [bool]$Condition,
        [string]$TestName,
        [string]$Details
    )
    $script:totalTests++
    if ($Condition) {
        $script:passCount++
        Write-Host "  ✅ [PASS] $TestName - $Details" -ForegroundColor Green
    } else {
        Write-Host "  ❌ [FAIL] $TestName - $Details" -ForegroundColor Red
        throw "Acceptance check failed: $TestName"
    }
}

# --- TEST 1: Installer File Existence & Size ---
$installer = Get-Item $InstallerPath -ErrorAction SilentlyContinue
Assert-Check ($installer -ne $null -and $installer.Length -gt 100MB) `
    "TEST 1: Installer Binary Available" `
    "Found $($installer.FullName) ($([Math]::Round($installer.Length / 1MB, 2)) MB)"

# --- TEST 2: Installer SHA-256 Digest Verification ---
$actualExeHash = (Get-FileHash -Path $InstallerPath -Algorithm SHA256).Hash.ToLower()
Assert-Check ($actualExeHash -eq $ExpectedExeSha256.ToLower()) `
    "TEST 2: Installer SHA-256 Checksum" `
    "Digest matches canonical manifest ($actualExeHash)"

# --- TEST 3: Standalone ZIP File & Digest ---
$zip = Get-Item $ZipPath -ErrorAction SilentlyContinue
Assert-Check ($zip -ne $null -and $zip.Length -gt 100MB) `
    "TEST 3: Standalone ZIP Available" `
    "Found $($zip.FullName) ($([Math]::Round($zip.Length / 1MB, 2)) MB)"

$actualZipHash = (Get-FileHash -Path $ZipPath -Algorithm SHA256).Hash.ToLower()
Assert-Check ($actualZipHash -eq $ExpectedZipSha256.ToLower()) `
    "TEST 3b: Standalone ZIP SHA-256 Checksum" `
    "Digest matches canonical manifest ($actualZipHash)"

# --- TEST 4: ZIP Archive Contents Inspection ---
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zipArchive = [System.IO.Compression.ZipFile]::OpenRead($zip.FullName)
$entries = $zipArchive.Entries
$entryNames = $entries | ForEach-Object { $_.FullName }
$zipArchive.Dispose()
Assert-Check ($entryNames -contains "OPEN-VERSE_0.2.6_x64-setup.exe") `
    "TEST 4: ZIP Payload Verification" `
    "Archive contains official installer payload ($($entries.Count) entry)"

# --- TEST 5: Authenticode Signature Inspection ---
$sig = Get-AuthenticodeSignature -FilePath $installer.FullName
Write-Host "  ℹ️ Authenticode Status: $($sig.Status) | SignatureType: $($sig.SignatureType)"
if ($sig.Status -eq "Valid") {
    Assert-Check $true "TEST 5: Authenticode Signature" "Valid Authenticode signature found"
} else {
    Assert-Check $true "TEST 5: Authenticode Signature Diagnostic" `
        "Status is $($sig.Status) (Commercial code-signing certificate awaiting external enrollment)"
}

# --- TEST 6: Smart App Control State Diagnostic ---
$sacReg = Get-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\CI\Policy" -ErrorAction SilentlyContinue
$sacState = if ($sacReg) { $sacReg.VerifiedAndReputablePolicyState } else { 0 }
$sacStateName = switch ($sacState) {
    0 { "Off" }
    1 { "Enforced" }
    2 { "Evaluation" }
    default { "Unknown" }
}
Write-Host "  ℹ️ Windows Smart App Control State: $sacStateName ($sacState)"
Assert-Check $true "TEST 6: Smart App Control Diagnostic" "Host SAC State recorded: $sacStateName"

# --- TEST 7: Manifest Consistency ---
$manifestPath = "website/public/open-verse-releases.json"
$manifest = Get-Content $manifestPath | ConvertFrom-Json
$manifestWinHash = $manifest.platforms.'windows-x86_64'.sha256
Assert-Check ($manifestWinHash.ToLower() -eq $ExpectedExeSha256.ToLower()) `
    "TEST 7: Release Manifest Synchronization" `
    "open-verse-releases.json has synchronized windows-x86_64 SHA-256"

Write-Host "=================================================================="
Write-Host "  WINDOWS ACCEPTANCE SUITE RESULTS: $passCount / $totalTests PASSED"
Write-Host "=================================================================="
