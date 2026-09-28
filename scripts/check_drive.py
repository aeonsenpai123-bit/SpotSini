import urllib.request
import re
import json

url = 'https://drive.google.com/drive/folders/1Sxk_3lHtP_OatkQBROXqfPTcsRov-rQv'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
try:
    with urllib.request.urlopen(req) as resp:
        html = resp.read().decode('utf-8')
    print('HTML length:', len(html))

    # Search for items in javascript payloads
    # Look for drive items data structures
    with open('drive_dump.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print('Dumped to drive_dump.html')

    # Find patterns of files
    img_patterns = re.findall(r'([a-zA-Z0-9_\-\.\s]+\.(?:jpg|jpeg|png|webp|JPG|JPEG|PNG))', html)
    print('Image matches count:', len(img_patterns))
    print('Sample image matches:', img_patterns[:20])

    # Search for any string like BIZ or Usaha or Penggilingan
    for m in re.finditer(r'(Penggilingan|PIK|Rujak|Ayam|Konveksi|Laundry|Bakso|Jambu|Potato)[^\"]*', html, re.IGNORECASE):
        print('Found snippet:', m.group(0)[:100])

except Exception as e:
    print('Error:', e)
