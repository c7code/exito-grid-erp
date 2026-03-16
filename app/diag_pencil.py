import re

path = r'C:\Users\Euller Matheus\exito-grid-erp\app\src\components\NewProposalDialog.tsx'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find the exact string to replace around the Eye/EyeOff button closing
idx = content.find('hover:bg-amber-100')
if idx == -1:
    print("NOT FOUND hover:bg-amber-100")
else:
    # Show 600 chars around it to identify exact string
    snippet = content[idx:idx+600]
    print(repr(snippet))
