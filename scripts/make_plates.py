"""Génère les planches WebP depuis plates-manifest.json.
rect en points PDF (origine haut-gauche, comme PyMuPDF). null = page entière.
Usage: python scripts/make_plates.py [slug]  (sans arg: tout le manifest)"""
import io, json, pathlib, sys
import fitz
from PIL import Image

manifest = json.loads(pathlib.Path('scripts/plates-manifest.json').read_text(encoding='utf-8'))
only = sys.argv[1] if len(sys.argv) > 1 else None
for e in manifest:
    if only and e['slug'] != only:
        continue
    doc = fitz.open(e['pdf'])
    page = doc[e['page'] - 1]
    clip = fitz.Rect(*e['rect']) if e.get('rect') else None
    pix = page.get_pixmap(dpi=300, clip=clip)
    img = Image.open(io.BytesIO(pix.tobytes('png'))).convert('RGB')
    if img.width > 1600:
        img = img.resize((1600, round(img.height * 1600 / img.width)), Image.LANCZOS)
    out = pathlib.Path('public/plates') / e['slug'] / e['out']
    out.parent.mkdir(parents=True, exist_ok=True)
    img.save(out, 'WEBP', quality=88)
    print(f"{e['slug']}/{e['out']}  {img.width}x{img.height}")
