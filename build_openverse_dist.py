import os, subprocess, sys

env = os.environ.copy()
env.pop('ELECTRON_RUN_AS_NODE', None)

builder_exe = os.path.abspath(r'sources\hermes-agent\node_modules\.bin\electron-builder.exe')
config_json = os.path.abspath('electron-builder-openverse.json')
prepackaged = os.path.abspath('openverse-app-stage')

cmd = [
    builder_exe,
    '--win', 'nsis', 'zip',
    '--prepackaged', prepackaged,
    '--config', config_json,
    '--projectDir', prepackaged
]

print('Running command:', ' '.join(cmd))
res = subprocess.run(cmd, env=env, text=True)
print('Return code:', res.returncode)
sys.exit(res.returncode)
