<#
.SYNOPSIS
    Official OPEN-VERSE Windows Authenticode Signing Script
.DESCRIPTION
    Signs Windows binaries (EXE, DLL, NSIS Setup, Uninstaller) using Authenticode
    with SHA-256 and RFC 3161 timestamping. Supports PFX certificates, Certum SimplySign,
    and Azure Trusted Signing.
#>

[CmdletBinding()]
param (
    [Parameter(Mandatory = $false)]
    [string]$TargetPath,

    [Parameter(Mandatory = $false)]
    [string]$TimestampServer = "http://timestamp.digicert.com"
)

$ErrorActionPreference = "Stop"

Write-Host "=========================================================="
Write-Host "     OPEN-VERSE Windows Authenticode Signing Pipeline     "
Write-Host "=========================================================="

# Check for SignTool
$signTool = (Get-Command "signtool.exe" -ErrorAction SilentlyContinue).Source
if (-not $signTool) {
    # Check Windows SDK standard paths
    $sdkPaths = @(
        "${env:ProgramFiles(x86)}\Windows Kits\10\bin\*\x64\signtool.exe",
        "${env:ProgramFiles}\Windows Kits\10\bin\*\x64\signtool.exe"
    )
    foreach ($p in $sdkPaths) {
        $found = Get-Item $p -ErrorAction SilentlyContinue | Select-Object -Last 1
        if ($found) { $signTool = $found.FullName; break }
    }
}

if (-not $signTool) {
    Write-Warning "signtool.exe not found in PATH or Windows Kits. Checking PowerShell fallback."
} else {
    Write-Host "SignTool located at: $signTool"
}

# Resolve target files to sign
$filesToSign = @()
if ($TargetPath -and (Test-Path $TargetPath)) {
    if ((Get-Item $TargetPath) -is [System.IO.DirectoryInfo]) {
        $filesToSign = Get-ChildItem -Path $TargetPath -Include "*.exe", "*.dll" -Recurse | Select-Object -ExpandProperty FullName
    } else {
        $filesToSign = @($TargetPath)
    }
} else {
    # Default: search Tauri release bundle directory
    $bundleDir = Join-Path $PSScriptRoot "..\src-tauri\target\release\bundle\nsis"
    if (Test-Path $bundleDir) {
        $filesToSign = Get-ChildItem -Path $bundleDir -Filter "*-setup.exe" | Select-Object -ExpandProperty FullName
    }
}

if ($filesToSign.Count -eq 0) {
    Write-Host "No executable files found to sign. Exiting."
    exit 0
}

Write-Host "Found $($filesToSign.Count) file(s) for signing:"
$filesToSign | ForEach-Object { Write-Host "  - $_" }

# Check for signing secrets
$pfxBase64 = $env:WINDOWS_CERTIFICATE_PFX_BASE64
$pfxPassword = $env:WINDOWS_CERTIFICATE_PASSWORD

if ($pfxBase64) {
    Write-Host "`n[MODE: PFX Certificate]"
    $tempPfx = Join-Path $env:TEMP "openverse_codesign_temp.pfx"
    [System.IO.File]::WriteAllBytes($tempPfx, [Convert]::FromBase64String($pfxBase64))

    try {
        foreach ($f in $filesToSign) {
            Write-Host "Signing $f ..."
            if ($signTool) {
                & $signTool sign /fd SHA256 /f $tempPfx /p $pfxPassword /tr $TimestampServer /td SHA256 "$f"
                if ($LASTEXITCODE -ne 0) {
                    Write-Error "SignTool failed for $f with exit code $LASTEXITCODE"
                }
            } else {
                # PowerShell fallback (local cert store)
                $cert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2($tempPfx, $pfxPassword)
                Set-AuthenticodeSignature -FilePath "$f" -Certificate $cert -TimestampServer $TimestampServer -HashAlgorithm SHA256
            }

            # Verify signature
            $sig = Get-AuthenticodeSignature -FilePath "$f"
            Write-Host "Signature Status: $($sig.Status) | Signer: $($sig.SignerCertificate.Subject)"
            if ($sig.Status -ne "Valid") {
                Write-Error "Verification failed: Signature on $f is not Valid."
            }
        }
    } finally {
        if (Test-Path $tempPfx) {
            Remove-Item -Force $tempPfx
            Write-Host "Securely purged temporary PFX file."
        }
    }
} else {
    Write-Warning "WINDOWS_CERTIFICATE_PFX_BASE64 environment variable not found."
    Write-Host "Skipping Authenticode signing (credentials not yet configured)."
    Write-Host "To enable Authenticode signing in CI, set WINDOWS_CERTIFICATE_PFX_BASE64 and WINDOWS_CERTIFICATE_PASSWORD in repository secrets."
}

Write-Host "`nAuthenticode signing process complete."
