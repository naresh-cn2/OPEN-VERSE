<#
.SYNOPSIS
    Official OPEN-VERSE Windows Authenticode Signing Pipeline
.DESCRIPTION
    Signs Windows binaries (EXE, DLL, MSI, NSIS Setup, Uninstaller) using Authenticode
    with SHA-256 and RFC 3161 timestamping. Supports PFX certificates, Local Certificate
    Store Thumbprint, and Microsoft Azure Trusted Signing.
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
        $filesToSign = Get-ChildItem -Path $TargetPath -Include "*.exe", "*.dll", "*.msi" -Recurse | Select-Object -ExpandProperty FullName
    } else {
        $filesToSign = @($TargetPath)
    }
} else {
    # Default: search Tauri release directory, sidecars, and NSIS/MSI outputs
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
    $bundleNsisDir = Join-Path $PSScriptRoot "..\src-tauri\target\release\bundle\nsis"
    if (Test-Path $bundleNsisDir) {
        $setups = Get-ChildItem -Path $bundleNsisDir -Filter "*-setup.exe" | Select-Object -ExpandProperty FullName
        $filesToSign += $setups
    }
    $bundleMsiDir = Join-Path $PSScriptRoot "..\src-tauri\target\release\bundle\msi"
    if (Test-Path $bundleMsiDir) {
        $msis = Get-ChildItem -Path $bundleMsiDir -Filter "*.msi" | Select-Object -ExpandProperty FullName
        $filesToSign += $msis
    }
}

if ($filesToSign.Count -eq 0) {
    Write-Host "No executable or MSI files found to sign."
    exit 0
}

Write-Host "Found $($filesToSign.Count) file(s) for signing:"
$filesToSign | ForEach-Object { Write-Host "  - $_" }

# 3. Determine Signing Mode
$pfxBase64 = $env:WINDOWS_CERTIFICATE_PFX_BASE64
$pfxPath = $env:WINDOWS_CERTIFICATE_PATH
$pfxPassword = $env:WINDOWS_CERTIFICATE_PASSWORD
$certThumbprint = $env:WINDOWS_CERTIFICATE_THUMBPRINT
$azureAccount = if ($env:AZURE_TRUSTED_SIGNING_ACCOUNT_NAME) { $env:AZURE_TRUSTED_SIGNING_ACCOUNT_NAME } else { $env:AZURE_TRUSTED_SIGNING_ACCOUNT }
$azureProfile = if ($env:AZURE_TRUSTED_SIGNING_CERTIFICATE_PROFILE) { $env:AZURE_TRUSTED_SIGNING_CERTIFICATE_PROFILE } else { $env:AZURE_CERT_PROFILE_NAME }
$azureEndpoint = if ($env:AZURE_TRUSTED_SIGNING_ENDPOINT) { $env:AZURE_TRUSTED_SIGNING_ENDPOINT } else { "https://eus.codesigning.azure.net" }

if ($azureAccount -and $azureProfile) {
    Write-Host "`n[MODE: Microsoft Azure Trusted Signing]"
    Write-Host "Account: $azureAccount | Profile: $azureProfile"
    
    $jsignVersion = "7.5"
    $jsignSha256 = "602A51C3545A6DC4FB99BD2EA7152B26D1345916D0C93DDFBD5936CB735AF91C"
    $keystore = $azureEndpoint -replace '^https://', '' -replace '/$', ''
    $jarDir = if ($env:RUNNER_TEMP) { $env:RUNNER_TEMP } else { $env:TEMP }
    $jar = Join-Path $jarDir "jsign-$jsignVersion.jar"

    if (-not (Test-Path $jar)) {
        Invoke-WebRequest -Uri "https://github.com/ebourg/jsign/releases/download/$jsignVersion/jsign-$jsignVersion.jar" -OutFile $jar
    }

    $env:JSIGN_STOREPASS = (az account get-access-token --resource https://codesigning.azure.net --query accessToken --output tsv)
    if (-not $env:JSIGN_STOREPASS) {
        throw "Failed to acquire an Azure Trusted Signing token. Ensure 'az login' or azure/login GitHub Action is configured."
    }

    foreach ($f in $filesToSign) {
        Write-Host "Signing $f with Azure Trusted Signing ..."
        java -jar $jar `
            --storetype TRUSTEDSIGNING `
            --keystore $keystore `
            --storepass env:JSIGN_STOREPASS `
            --alias "$azureAccount/$azureProfile" `
            --alg SHA-256 `
            --tsaurl http://timestamp.acs.microsoft.com `
            --tsmode RFC3161 `
            --replace `
            "$f"

        if ($LASTEXITCODE -ne 0) {
            Write-Error "jsign signing failed for $f with exit code $LASTEXITCODE"
        }

        $sig = Get-AuthenticodeSignature -FilePath "$f"
        if ($sig.Status -eq "Valid") {
            Write-Host "Signature Status: Valid | Signer: $($sig.SignerCertificate.Subject)"
        } elseif ($sig.Status -eq "UnknownError") {
            Write-Warning "Signature Status: Untrusted Root or Self-Signed Certificate ($($sig.StatusMessage)) | Signer: $($sig.SignerCertificate.Subject)"
        } else {
            Write-Error "Verification failed: Signature on $f is $($sig.Status) ($($sig.StatusMessage))"
        }
    }
}
elseif ($pfxBase64 -or ($pfxPath -and (Test-Path $pfxPath))) {
    Write-Host "`n[MODE: Authenticode PFX Certificate]"
    $tempPfx = $null
    if ($pfxBase64) {
        $tempDir = if ($env:RUNNER_TEMP) { $env:RUNNER_TEMP } else { $env:TEMP }
        $tempPfx = Join-Path $tempDir "openverse_codesign_temp.pfx"
        [System.IO.File]::WriteAllBytes($tempPfx, [Convert]::FromBase64String($pfxBase64))
        $certFile = $tempPfx
    } else {
        $certFile = $pfxPath
    }

    try {
        foreach ($f in $filesToSign) {
            Write-Host "Signing $f with PFX ..."
            if ($signTool) {
                if ($pfxPassword) {
                    & $signTool sign /fd SHA256 /f $certFile /p $pfxPassword /tr $TimestampServer /td SHA256 "$f"
                } else {
                    & $signTool sign /fd SHA256 /f $certFile /tr $TimestampServer /td SHA256 "$f"
                }
                if ($LASTEXITCODE -ne 0) {
                    Write-Error "SignTool failed for $f with exit code $LASTEXITCODE"
                }
            } else {
                $cert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2($certFile, $pfxPassword)
                Set-AuthenticodeSignature -FilePath "$f" -Certificate $cert -TimestampServer $TimestampServer -HashAlgorithm SHA256
            }

            $sig = Get-AuthenticodeSignature -FilePath "$f"
            if ($sig.Status -eq "Valid") {
                Write-Host "Signature Status: Valid | Signer: $($sig.SignerCertificate.Subject)"
            } elseif ($sig.Status -eq "UnknownError") {
                Write-Warning "Signature Status: Untrusted Root or Self-Signed Certificate ($($sig.StatusMessage)) | Signer: $($sig.SignerCertificate.Subject)"
            } else {
                Write-Error "Verification failed: Signature on $f is $($sig.Status) ($($sig.StatusMessage))"
            }
        }
    } finally {
        if ($tempPfx -and (Test-Path $tempPfx)) {
            Remove-Item -Force $tempPfx -ErrorAction SilentlyContinue
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
        if ($sig.Status -eq "Valid") {
            Write-Host "Signature Status: Valid | Signer: $($sig.SignerCertificate.Subject)"
        } elseif ($sig.Status -eq "UnknownError") {
            Write-Warning "Signature Status: Untrusted Root or Self-Signed Certificate ($($sig.StatusMessage)) | Signer: $($sig.SignerCertificate.Subject)"
        } else {
            Write-Error "Verification failed: Signature on $f is $($sig.Status) ($($sig.StatusMessage))"
        }
    }
}
else {
    Write-Warning "No Authenticode code signing credentials found in environment."
    Write-Host "Supported secrets/variables:"
    Write-Host "  - Azure Trusted Signing: AZURE_TRUSTED_SIGNING_ACCOUNT_NAME + AZURE_TRUSTED_SIGNING_CERTIFICATE_PROFILE"
    Write-Host "  - PFX Certificate: WINDOWS_CERTIFICATE_PFX_BASE64 + WINDOWS_CERTIFICATE_PASSWORD"
    Write-Host "  - Windows Store Thumbprint: WINDOWS_CERTIFICATE_THUMBPRINT"
    if ($Strict) {
        Write-Error "CRITICAL: Authenticode signing is strictly required, but no signing credentials are configured."
        exit 1
    }
    Write-Host "Skipping Authenticode signing (external credentials not yet provisioned)."
}

Write-Host "`nAuthenticode signing process complete."
