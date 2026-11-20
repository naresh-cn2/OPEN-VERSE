$endpoints = [ordered]@{
    "Windows NSIS"          = "https://github.com/naresh-cn2/OPEN-VERSE/releases/download/v0.2.6/OPEN-VERSE_0.2.6_x64-setup.exe"
    "Windows ZIP"           = "https://github.com/naresh-cn2/OPEN-VERSE/releases/download/v0.2.6/OPEN-VERSE_0.2.6_x64-windows.zip"
    "Windows Sig"           = "https://github.com/naresh-cn2/OPEN-VERSE/releases/download/v0.2.6/OPEN-VERSE_0.2.6_x64-setup.exe.sig"
    "Mac DMG"               = "https://github.com/naresh-cn2/OPEN-VERSE/releases/download/desktop-latest/OPEN-VERSE_0.2.0_aarch64.dmg"
    "Linux DEB"             = "https://github.com/naresh-cn2/OPEN-VERSE/releases/download/desktop-latest/OPEN-VERSE_0.2.0_amd64.deb"
    "Linux RPM"             = "https://github.com/naresh-cn2/OPEN-VERSE/releases/download/desktop-latest/OPEN-VERSE-0.2.0-1.x86_64.rpm"
    "Android APK Local"     = "http://localhost:3300/open-verse-mobile.apk"
    "Android APK Vercel"    = "https://open-verse-website.vercel.app/open-verse-mobile.apk"
    "Android Versioned APK" = "https://github.com/naresh-cn2/OPEN-VERSE/releases/download/v0.2.6/open-verse-v0.2.6-android.apk"
    "Android ZIP"           = "https://github.com/naresh-cn2/OPEN-VERSE/releases/download/v0.2.6/open-verse-mobile-v0.2.6.zip"
}

Write-Host "=================================================================="
Write-Host "             OPEN-VERSE DOWNLOAD ENDPOINT AUDIT                  "
Write-Host "=================================================================="

foreach ($item in $endpoints.GetEnumerator()) {
    $name = $item.Key
    $url = $item.Value
    try {
        $res = Invoke-WebRequest -Uri $url -Method Head -MaximumRedirection 5 -UseBasicParsing -TimeoutSec 10
        $status = $res.StatusCode
        $len = $res.Headers["Content-Length"]
        Write-Host "[OK] $name : HTTP $status | Length: $len bytes"
    } catch {
        Write-Host "[FAIL] $name : $($_.Exception.Message)"
    }
}
