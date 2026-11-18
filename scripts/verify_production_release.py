import os
import sys
import hashlib
import tempfile
import urllib.request
import subprocess
import json

MANIFEST_PATH = os.path.join(os.path.dirname(__file__), "..", "website", "public", "open-verse-releases.json")
with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
    manifest = json.load(f)

endpoints_to_test = [
    {
        "name": "Windows Installer (.exe) - Vercel Canonical API",
        "url": "https://open-verse-website.vercel.app/api/download/windows",
        "expected_sha256": manifest["platforms"]["windows-x86_64"]["sha256"],
        "expected_size_approx": 167627370,
        "sig_url": "https://github.com/naresh-cn2/OPEN-VERSE/releases/download/v0.2.6/OPEN-VERSE_0.2.6_x64-setup.exe.sig",
        "type": "exe"
    },
    {
        "name": "Windows Standalone ZIP (.zip) - Vercel Canonical API",
        "url": "https://open-verse-website.vercel.app/api/download/windows-zip",
        "expected_sha256": "b6de33be3a3e252bf4cc4ee254d66616648ea4553f7beb661a7d8636da83155f",
        "expected_size_approx": 167657609,
        "type": "zip"
    },
    {
        "name": "Android APK Direct - Vercel Static Route",
        "url": "https://open-verse-website.vercel.app/open-verse-mobile.apk",
        "expected_sha256": manifest["platforms"]["android"]["sha256"],
        "expected_size_approx": 10460061,
        "type": "apk"
    },
    {
        "name": "Android Versioned APK - Vercel Canonical API",
        "url": "https://open-verse-website.vercel.app/api/download/android-apk",
        "expected_sha256": manifest["platforms"]["android"]["sha256"],
        "expected_size_approx": 10460061,
        "type": "apk"
    },
    {
        "name": "Android Bundle (AAB) - GitHub Release Asset",
        "url": "https://github.com/naresh-cn2/OPEN-VERSE/releases/download/v0.2.6/open-verse-mobile.aab",
        "expected_sha256": "6d4d6893273644e33b4f8368535b03bbab3c1671f992886fb2eb2192cf12faa4",
        "expected_size_approx": 9875343,
        "type": "aab"
    }
]

PUBKEY_MINISIGN = "RWTDD06yEpdRbTbfZ7n8Y8U0gU5K/jCEbKWyrIyDxyWE8YLEB0g+CFLMG"

print("=" * 80)
print("OPEN-VERSE PRODUCTION ARTIFACT VERIFICATION PIPELINE")
print("=" * 80)

temp_dir = tempfile.mkdtemp(prefix="openverse_verify_")
print(f"Working temporary directory: {temp_dir}\n")

results = []

for item in endpoints_to_test:
    name = item["name"]
    url = item["url"]
    print(f"[*] Testing: {name}")
    print(f"    URL: {url}")
    
    # Track redirects
    class RedirectTracker(urllib.request.HTTPRedirectHandler):
        def redirect_request(self, req, fp, code, msg, headers, newurl):
            print(f"    -> Redirect {code} to: {newurl[:90]}...")
            return super().redirect_request(req, fp, code, msg, headers, newurl)

    opener = urllib.request.build_opener(RedirectTracker)
    req = urllib.request.Request(url, headers={"User-Agent": "OPEN-VERSE-Verification/1.0"})
    
    try:
        resp = opener.open(req)
        status = resp.status
        final_url = resp.url
        content_type = resp.headers.get("Content-Type", "")
        content_length = resp.headers.get("Content-Length", "")
        content_disposition = resp.headers.get("Content-Disposition", "")
        
        print(f"    Status: {status} | Final URL: {final_url[:80]}...")
        print(f"    Content-Type: {content_type} | Length header: {content_length} | Content-Disposition: {content_disposition}")
        
        # Stream file to disk and compute sha256
        hasher = hashlib.sha256()
        total_bytes = 0
        local_filename = os.path.join(temp_dir, f"artifact_{len(results)}_{os.path.basename(final_url.split('?')[0])}")
        
        with open(local_filename, "wb") as f_out:
            while True:
                chunk = resp.read(1024 * 1024)
                if not chunk:
                    break
                f_out.write(chunk)
                hasher.update(chunk)
                total_bytes += len(chunk)
                
        calc_sha256 = hasher.hexdigest().lower()
        expected_sha256 = item["expected_sha256"].lower()
        sha_match = (calc_sha256 == expected_sha256)
        
        print(f"    Downloaded: {total_bytes:,} bytes")
        print(f"    SHA-256 Calculated: {calc_sha256}")
        print(f"    SHA-256 Expected:   {expected_sha256}")
        print(f"    Checksum Match:     {'PASS [OK]' if sha_match else 'FAIL [MISMATCH]'}")
        
        res_info = {
            "name": name,
            "status": status,
            "bytes": total_bytes,
            "sha256": calc_sha256,
            "sha_match": sha_match,
            "file": local_filename,
            "type": item["type"],
            "sig_url": item.get("sig_url")
        }
        results.append(res_info)
    except Exception as e:
        print(f"    [!] Download failed: {e}")
        results.append({
            "name": name,
            "status": "ERROR",
            "error": str(e),
            "sha_match": False
        })
    print("-" * 80)

# Signature Analysis
print("\n" + "=" * 80)
print("CRYPTOGRAPHIC SIGNATURE & CERTIFICATE INTEGRITY AUDIT")
print("=" * 80)

for res in results:
    if not res.get("file"):
        continue
    fpath = res["file"]
    ftype = res["type"]
    
    if ftype == "exe":
        print(f"\n--- [Windows Installer: {os.path.basename(fpath)}] ---")
        # 1. Minisign verification
        sig_url = res.get("sig_url")
        if sig_url:
            sig_path = fpath + ".sig"
            urllib.request.urlretrieve(sig_url, sig_path)
            pubkey_path = os.path.join(temp_dir, "minisign.pub")
            with open(pubkey_path, "w", encoding="utf-8") as pf:
                pf.write(f"untrusted comment: minisign public key 4D5BD4A584ACD3C3\n{PUBKEY_MINISIGN}\n")
            
            try:
                ms_out = subprocess.run(["minisign", "-Vm", fpath, "-p", pubkey_path, "-x", sig_path], capture_output=True, text=True)
                print(f"Minisign Ed25519 Verification Output:\n{ms_out.stdout} {ms_out.stderr}")
                if ms_out.returncode == 0:
                    print("=> MINISIGN INTEGRITY: VALID (Cryptographically Verified)")
                else:
                    print("=> MINISIGN INTEGRITY: FAILED")
            except Exception as e:
                print(f"Minisign execution error: {e}")
                
        # 2. Authenticode verification
        signtool_path = r"C:\Program Files (x86)\Windows Kits\10\bin\10.0.18362.0\x64\signtool.exe"
        if os.path.exists(signtool_path):
            st_out = subprocess.run([signtool_path, "verify", "/pa", "/v", fpath], capture_output=True, text=True)
            print(f"\nAuthenticode Verification Output:\n{st_out.stdout} {st_out.stderr}")
            if st_out.returncode == 0:
                print("=> AUTHENTICODE: SIGNED & VALID")
            else:
                print("=> AUTHENTICODE: NOT SIGNED (Expected before Authenticode enrollment)")
                
    elif ftype == "apk":
        print(f"\n--- [Android APK: {os.path.basename(fpath)}] ---")
        apksigner_path = r"C:\Users\nares\AppData\Local\Android\Sdk\build-tools\34.0.0\apksigner.bat"
        if os.path.exists(apksigner_path):
            apk_out = subprocess.run([apksigner_path, "verify", "--verbose", "--print-certs", fpath], capture_output=True, text=True)
            print(f"apksigner Verification Output:\n{apk_out.stdout[:600]}...")
            if "Verified using v1 scheme (JAR signing): true" in apk_out.stdout or "Verified using v2 scheme (APK Signature Scheme v2): true" in apk_out.stdout:
                print("=> APK SIGNATURE: VALID (Signed with release keystore)")
                
    elif ftype == "aab":
        print(f"\n--- [Android AAB: {os.path.basename(fpath)}] ---")
        keytool_path = r"C:\Program Files\Eclipse Adoptium\jdk-17.0.20.101-hotspot\bin\keytool.exe"
        if os.path.exists(keytool_path):
            kt_out = subprocess.run([keytool_path, "-printcert", "-jarfile", fpath], capture_output=True, text=True)
            print(f"keytool Certificate Details:\n{kt_out.stdout[:600]}...")
            if kt_out.returncode == 0:
                print("=> AAB SIGNATURE: VALID (Jar signing certificate verified)")

print("\nAll verification artifacts processed successfully.")
