<#
.SYNOPSIS
    Official OPEN-VERSE Windows Authenticode Signing Pipeline
.DESCRIPTION
    Signs Windows binaries (EXE, DLL, NSIS Setup, Uninstaller) using Authenticode
    with SHA-256 and RFC 3161 timestamping. Supports PFX certificates, Certum SimplySign,
    Local Certificate Store Thumbprint, and Microsoft Trusted Signing (Azure Code Signing).
#>

[CmdletBinding()]
param (
    [Parameter(Mandatory = $false)]
    [string]$TargetPath,

    [Parameter(Mandatory = $false)]
    [string]$TimestampServer = "http://timestamp.digicert.com",

    [Parameter(Mandatory = $false)]
    [switch]$Strict = $false
)

$ErrorActionPreference = "Stop"

if ($env:REQUIRE_AUTHENTICODE_SIGNING -eq "true" -or $env:REQUIRE_AUTHENTICODE_SIGNING -eq "1") {
    $Strict = $true
}

Write-Host "=========================================================="
Write-Host "     OPEN-VERSE Windows Authenticode Signing Pipeline     "
Write-Host "=========================================================="

# 1. Locate SignTool
$signTool = (Get-Command "signtool.exe" -ErrorAction SilentlyContinue).Source
if (-not $signTool) {
    $sdkPaths = @(
        "${env:ProgramFiles(x86)}\Windows Kits\10\bin\*\x64\signtool.exe",
        "${env:ProgramFiles}\Windows Kits\10\bin\*\x64\signtool.exe",
        "${env:ProgramFiles(x86)}\Windows Kits\10\App Certification Kit\signtool.exe"
    )
    foreach ($p in $sdkPaths) {
        $found = Get-Item $p -ErrorAction SilentlyContinue | Select-Object -Last 1
        if ($found) { $signTool = $found.FullName; break }
    }
}

if ($signTool) {
    Write-Host "SignTool located at: $signTool"
} else {
    Write-Warning "signtool.exe not found in PATH or Windows Kits. Will attempt PowerShell fallback."
}

# 2. Resolve Target Files
$filesToSign = @()
if ($TargetPath -and (Test-Path $TargetPath)) {
    if ((Get-Item $TargetPath) -is [System.IO.DirectoryInfo]) {
        $filesToSign = Get-ChildItem -Path $TargetPath -Include "*.exe", "*.dll" -Recurse | Select-Object -ExpandProperty FullName
    } else {
        $filesToSign = @($TargetPath)
    }
} else {
    # Default: search Tauri release directory, sidecars, and NSIS outputs
    $releaseDir = Join-Path $PSScriptRoot "..\src-tauri\target\release"
    if (Test-Path $releaseDir) {
        $mainExe = Join-Path $releaseDir "open-verse.exe"
        if (Test-Path $mainExe) { $filesToSign += $mainExe }
    }
    $sidecarDir = Join-Path $PSScriptRoot "..\src-tauri\bin"
    if (Test-Path $sidecarDir) {
        $sidecars = Get-ChildItem -Path $sidecarDir -Include "*.exe" -Recurse | Select-Object -ExpandProperty FullName
        $filesToSign += $sidecars
    }
    $bundleDir = Join-Path $PSScriptRoot "..\src-tauri\target\release\bundle\nsis"
    if (Test-Path $bundleDir) {
        $setups = Get-ChildItem -Path $bundleDir -Filter "*-setup.exe" | Select-Object -ExpandProperty FullName
        $filesToSign += $setups
    }
}

if ($filesToSign.Count -eq 0) {
    Write-Host "No executable files found to sign. Exiting."
    exit 0
}

Write-Host "Found $($filesToSign.Count) file(s) for signing:"
$filesToSign | ForEach-Object { Write-Host "  - $_" }

# 3. Determine Signing Mode
$pfxBase64 = $env:WINDOWS_CERTIFICATE_PFX_BASE64
$pfxPassword = $env:WINDOWS_CERTIFICATE_PASSWORD
$certThumbprint = $env:WINDOWS_CERTIFICATE_THUMBPRINT
$azureAccount = $env:AZURE_TRUSTED_SIGNING_ACCOUNT
$azureProfile = $env:AZURE_CERT_PROFILE_NAME

if ($azureAccount -and $azureProfile) {
    Write-Host "`n[MODE: Microsoft Trusted Signing / Azure Code Signing]"
    Write-Host "Account: $azureAccount | Profile: $azureProfile"
    
    # Check for dlib
    $dlibPath = (Get-Command "Azure.CodeSigning.Dlib.dll" -ErrorAction SilentlyContinue).Source
    if (-not $dlibPath) {
        $dlibPath = Join-Path $env:ProgramFiles "Microsoft Trusted Signing Client\Azure.CodeSigning.Dlib.dll"
    }

    $metaJson = Join-Path $env:TEMP "azure_codesigning_metadata.json"
    @{
        Endpoint = if ($env:AZURE_TRUSTED_SIGNING_ENDPOINT) { $env:AZURE_TRUSTED_SIGNING_ENDPOINT } else { "https://eus.codesigning.azure.net" }
        CodeSigningAccountName = $azureAccount
        CertificateProfileName = $azureProfile
    } | ConvertTo-Json | Set-Content -Path $metaJson -Encoding UTF8

    try {
        foreach ($f in $filesToSign) {
            Write-Host "Signing $f with Microsoft Trusted Signing ..."
            if ($signTool -and (Test-Path $dlibPath)) {
                & $signTool sign /v /fd SHA256 /tr "http://timestamp.acs.microsoft.com" /td SHA256 /dlib "$dlibPath" /dmdf "$metaJson" "$f"
                if ($LASTEXITCODE -ne 0) {
                    Write-Error "SignTool Trusted Signing failed for $f with exit code $LASTEXITCODE"
                }
            } else {
                Write-Error "Microsoft Trusted Signing requires SignTool and Azure.CodeSigning.Dlib.dll."
            }

            # Verify signature
            $sig = Get-AuthenticodeSignature -FilePath "$f"
            Write-Host "Signature Status: $($sig.Status) | Signer: $($sig.SignerCertificate.Subject)"
            if ($sig.Status -ne "Valid") {
                Write-Error "Verification failed: Signature on $f is not Valid."
            }
        }
    } finally {
        if (Test-Path $metaJson) { Remove-Item -Force $metaJson }
    }
}
elseif ($pfxBase64) {
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
}
elseif ($certThumbprint) {
    Write-Host "`n[MODE: Local Certificate Store Thumbprint: $certThumbprint]"
    foreach ($f in $filesToSign) {
        Write-Host "Signing $f with Store Certificate ..."
        if ($signTool) {
            & $signTool sign /sha1 $certThumbprint /fd SHA256 /tr $TimestampServer /td SHA256 "$f"
            if ($LASTEXITCODE -ne 0) {
                Write-Error "SignTool failed for $f with exit code $LASTEXITCODE"
            }
        } else {
            $cert = Get-Item "Cert:\CurrentUser\My\$certThumbprint" -ErrorAction SilentlyContinue
            if (-not $cert) { $cert = Get-Item "Cert:\LocalMachine\My\$certThumbprint" -ErrorAction SilentlyContinue }
            if (-not $cert) { Write-Error "Certificate with thumbprint $certThumbprint not found in stores." }
            Set-AuthenticodeSignature -FilePath "$f" -Certificate $cert -TimestampServer $TimestampServer -HashAlgorithm SHA256
        }

        $sig = Get-AuthenticodeSignature -FilePath "$f"
        Write-Host "Signature Status: $($sig.Status) | Signer: $($sig.SignerCertificate.Subject)"
        if ($sig.Status -ne "Valid") {
            Write-Error "Verification failed: Signature on $f is not Valid."
        }
    }
}
else {
    Write-Warning "No Authenticode code signing credentials found in environment."
    Write-Host "Supported secrets/variables:"
    Write-Host "  - WINDOWS_CERTIFICATE_PFX_BASE64 + WINDOWS_CERTIFICATE_PASSWORD"
    Write-Host "  - AZURE_TRUSTED_SIGNING_ACCOUNT + AZURE_CERT_PROFILE_NAME"
    Write-Host "  - WINDOWS_CERTIFICATE_THUMBPRINT"
    if ($Strict) {
        Write-Error "CRITICAL: Authenticode signing is strictly required, but no signing credentials are configured."
        exit 1
    }
    Write-Host "Skipping Authenticode signing (external credentials not yet provisioned)."
}

Write-Host "`nAuthenticode signing process complete."
