import json, os

with open('cli.js.map', 'r') as f:
    data = json.load(f)

for path, content in zip(data['sources'], data['sourcesContent']):
    dest = os.path.join('restored', path.lstrip('../'))
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    with open(dest, 'w') as f:
        f.write(content)