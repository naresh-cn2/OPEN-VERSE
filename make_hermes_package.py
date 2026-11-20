import zipfile, os

src = 'OPEN-VERSE/hermes-agent'
out = 'openverse/dist-release/Hermes-Agent-2026.9.24-windows.zip'

with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
    for root, dirs, files in os.walk(src):
        dirs[:] = [d for d in dirs if d not in ('node_modules', '.git', '__pycache__')]
        for f in files:
            full = os.path.join(root, f)
            rel = os.path.relpath(full, src)
            z.write(full, rel)
    z.write('OPEN-VERSE/hermes-agent/scripts/hermes-openverse.bat', 'scripts/hermes-openverse.bat')
    z.write('OPEN-VERSE/hermes-agent/scripts/hermes-openverse.ps1', 'scripts/hermes-openverse.ps1')

readme = r"""# Hermes Agent — Local Dev Build (from your OPEN-VERSE repo)

Full Hermes Agent source running from your repository. MIT-licensed.

## Launch
Windows: double-click scripts/hermes-openverse.bat
PowerShell: scripts/hermes-openverse.ps1

## First run
Installs pinned Python 3.14 + dependencies (~2 min one-time).
Config/memory isolated at C:\Users\nares\.hermes-openverse

## Source
OPEN-VERSE/hermes-agent/ — complete Hermes Agent source (agent/, tools/, gateway/, providers/, hermes_cli/, ui-tui/, apps/, skills/…)
"""
z_was_closed = True  # z already closed by with block
import zipfile as _zf
with _zf.ZipFile(out, 'a', _zf.ZIP_DEFLATED) as z2:
    z2.writestr('README-Hermes-Agent.txt', readme)

print('Package created:', out)
print('Size MB:', round(os.path.getsize(out) / 1024 / 1024, 2))
