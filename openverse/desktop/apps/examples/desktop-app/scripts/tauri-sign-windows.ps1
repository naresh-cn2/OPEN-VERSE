# Authenticode-signs one PE or MSI file with Microsoft Azure Trusted Signing or PFX via SignTool.
#
# Invoked by the Tauri bundler through `bundle > windows > signCommand` (the
# release workflows generate a config overlay pointing here), once per
# binary it stages: the main app exe, external binaries, the NSIS uninstaller,
# and the NSIS/MSI installer itself.
#
# Supports:
# 1. Microsoft Azure Trusted Signing (via jsign and Azure CLI OIDC token)
# 2. Authenticode PFX Certificate (via SignTool.exe or Set-AuthenticodeSignature)
# 3. Windows Certificate Store Thumbprint (via SignTool.exe)

param(
  [Parameter(Mandatory = $true, Position = 0)]
  [string] $Path
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $Path)) {
  throw "Target file does not exist: $Path"
}

$resolved = (Resolve-Path $Path).Path
Write-Host "`n[OPEN-VERSE Authenticode] Processing file: $resolved"

# 1. Locate SignTool if available
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

# 2. Check Azure Trusted Signing
$azureEndpoint = $env:AZURE_TRUSTED_SIGNING_ENDPOINT
$azureAccount = if ($env:AZURE_TRUSTED_SIGNING_ACCOUNT_NAME) { $env:AZURE_TRUSTED_SIGNING_ACCOUNT_NAME } else { $env:AZURE_TRUSTED_SIGNING_ACCOUNT }
$azureCertProfile = if ($env:AZURE_TRUSTED_SIGNING_CERTIFICATE_PROFILE) { $env:AZURE_TRUSTED_SIGNING_CERTIFICATE_PROFILE } else { $env:AZURE_CERT_PROFILE_NAME }

# 3. Check PFX Certificate
$pfxBase64 = $env:WINDOWS_CERTIFICATE_PFX_BASE64
$pfxPath = $env:WINDOWS_CERTIFICATE_PATH
$pfxPassword = $env:WINDOWS_CERTIFICATE_PASSWORD
$certThumbprint = $env:WINDOWS_CERTIFICATE_THUMBPRINT
$timestampServer = if ($env:TIMESTAMP_SERVER) { $env:TIMESTAMP_SERVER } else { "http://timestamp.digicert.com" }

if ($azureAccount -and $azureCertProfile) {
  Write-Host "[MODE] Microsoft Azure Trusted Signing"
  $jsignVersion = "7.5"
  $jsignSha256 = "602A51C3545A6DC4FB99BD2EA7152B26D1345916D0C93DDFBD5936CB735AF91C"

  $keystore = if ($azureEndpoint) { $azureEndpoint -replace '^https://', '' -replace '/$', '' } else { "eus.codesigning.azure.net" }
  $jarDir = if ($env:RUNNER_TEMP) { $env:RUNNER_TEMP } else { $env:TEMP }
  $jar = Join-Path $jarDir "jsign-$jsignVersion.jar"

  if (-not (Test-Path $jar)) {
    Write-Host "Downloading jsign $jsignVersion..."
    Invoke-WebRequest -Uri "https://github.com/ebourg/jsign/releases/download/$jsignVersion/jsign-$jsignVersion.jar" -OutFile $jar
  }
  $actualHash = (Get-FileHash -Algorithm SHA256 $jar).Hash
  if ($actualHash -ne $jsignSha256) {
    Remove-Item $jar -Force -ErrorAction SilentlyContinue
    throw "jsign jar checksum mismatch: expected $jsignSha256, got $actualHash"
  }

  $env:JSIGN_STOREPASS = (az account get-access-token --resource https://codesigning.azure.net --query accessToken --output tsv)
  if (-not $env:JSIGN_STOREPASS) {
    throw "Failed to acquire an Azure Trusted Signing token. Ensure 'az login' or azure/login GitHub Action is configured."
  }

  Write-Host "Signing $resolved with Azure Trusted Signing ($azureAccount / $azureCertProfile)..."
  java -jar $jar `
    --storetype TRUSTEDSIGNING `
    --keystore $keystore `
    --storepass env:JSIGN_STOREPASS `
    --alias "$azureAccount/$azureCertProfile" `
    --alg SHA-256 `
    --tsaurl http://timestamp.acs.microsoft.com `
    --tsmode RFC3161 `
    --replace `
    $resolved

  if ($LASTEXITCODE -ne 0) {
    throw "jsign signing failed for $resolved with exit code $LASTEXITCODE"
  }
}
elseif ($pfxBase64 -or ($pfxPath -and (Test-Path $pfxPath))) {
  Write-Host "[MODE] Authenticode PFX Certificate"
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
    Write-Host "Signing $resolved with PFX certificate..."
    if ($signTool) {
      if ($pfxPassword) {
        & $signTool sign /fd SHA256 /f $certFile /p $pfxPassword /tr $timestampServer /td SHA256 "$resolved"
      } else {
        & $signTool sign /fd SHA256 /f $certFile /tr $timestampServer /td SHA256 "$resolved"
      }
      if ($LASTEXITCODE -ne 0) {
        throw "SignTool failed for $resolved with exit code $LASTEXITCODE"
      }
    } else {
      # Fallback to Set-AuthenticodeSignature
      $cert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2($certFile, $pfxPassword)
      $sigResult = Set-AuthenticodeSignature -FilePath "$resolved" -Certificate $cert -TimestampServer $timestampServer -HashAlgorithm SHA256
      if ($sigResult.Status -ne "Valid") {
        throw "Set-AuthenticodeSignature returned status: $($sigResult.Status) - $($sigResult.StatusMessage)"
      }
    }
  } finally {
    if ($tempPfx -and (Test-Path $tempPfx)) {
      Remove-Item -Force $tempPfx -ErrorAction SilentlyContinue
    }
  }
}
elseif ($certThumbprint) {
  Write-Host "[MODE] Certificate Store Thumbprint: $certThumbprint"
  if ($signTool) {
    & $signTool sign /sha1 $certThumbprint /fd SHA256 /tr $timestampServer /td SHA256 "$resolved"
    if ($LASTEXITCODE -ne 0) {
      throw "SignTool thumbprint signing failed for $resolved with exit code $LASTEXITCODE"
    }
  } else {
    $cert = Get-Item "Cert:\CurrentUser\My\$certThumbprint" -ErrorAction SilentlyContinue
    if (-not $cert) { $cert = Get-Item "Cert:\LocalMachine\My\$certThumbprint" -ErrorAction SilentlyContinue }
    if (-not $cert) { throw "Certificate with thumbprint $certThumbprint not found in Windows stores." }
    $sigResult = Set-AuthenticodeSignature -FilePath "$resolved" -Certificate $cert -TimestampServer $timestampServer -HashAlgorithm SHA256
    if ($sigResult.Status -ne "Valid") {
      throw "Set-AuthenticodeSignature returned status: $($sigResult.Status) - $($sigResult.StatusMessage)"
    }
  }
}
else {
  if ($env:REQUIRE_AUTHENTICODE_SIGNING -eq "true" -or $env:REQUIRE_AUTHENTICODE_SIGNING -eq "1") {
    throw "Authenticode signing is strictly required, but no signing credentials (AZURE_TRUSTED_SIGNING_* or WINDOWS_CERTIFICATE_*) are configured."
  }
  Write-Warning "Skipping Authenticode signing for ${resolved}: No signing credentials found in environment."
  Write-Host "To enable Authenticode signing, configure either:"
  Write-Host "  - Azure Trusted Signing: AZURE_TRUSTED_SIGNING_ACCOUNT_NAME + AZURE_TRUSTED_SIGNING_CERTIFICATE_PROFILE"
  Write-Host "  - PFX Certificate: WINDOWS_CERTIFICATE_PFX_BASE64 + WINDOWS_CERTIFICATE_PASSWORD"
  exit 0
}

# 4. Verify Authenticode Signature
$signature = Get-AuthenticodeSignature $resolved
if ($signature.Status -eq "Valid") {
  Write-Host "Authenticode Signature Verified: $resolved [Valid - $($signature.SignerCertificate.Subject)]"
} else {
  Write-Warning "Authenticode Status: $($signature.Status) - $($signature.StatusMessage)"
}
