import os

files_to_modify = {
    'temp-asar-inspect/dist/assets/index-DycJko5p.js': [('HERMES AGENT', 'OPEN-VERSE')],
    'temp-asar-inspect/dist/assets/main-BB8VROYA.js': [('HERMES AGENT', 'OPEN-VERSE'), ('Hermes Agent', 'OPEN-VERSE')],
    'temp-asar-inspect/dist/assets/actions-vBgu8qK6.js': [
        ('Give Hermes a task', 'Give OPEN-VERSE a task'),
        ('Starting Hermes...', 'Starting OPEN-VERSE...'),
        ('Reconnecting to Hermes…', 'Reconnecting to OPEN-VERSE…'),
        ('Hermes Agent', 'OPEN-VERSE')
    ],
    'temp-asar-inspect/dist/index.html': [('<title>Hermes</title>', '<title>OPEN-VERSE</title>')],
    'temp-asar-inspect/package.json': [('"productName": "Hermes"', '"productName": "OPEN-VERSE"'), ('"name": "HermesBundled"', '"name": "OpenVerse"')]
}

for path, replacements in files_to_modify.items():
    if not os.path.exists(path):
        print('Warning: path does not exist:', path)
        continue
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    for old, new in replacements:
        count = content.count(old)
        content = content.replace(old, new)
        print(f'{path}: replaced {count} occurrences of "{old}" with "{new}"')
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

print('Brand patching complete!')
