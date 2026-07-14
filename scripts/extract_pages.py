"""Rend chaque page d'un PDF en PNG 300 dpi dans _staging/<slug>/ pour curation visuelle.
Usage: python scripts/extract_pages.py <pdf_path> <slug> [--from N] [--to N]"""
import sys, pathlib, fitz

pdf_path, slug = sys.argv[1], sys.argv[2]
args = sys.argv[3:]
p_from = int(args[args.index('--from')+1]) if '--from' in args else 1
doc = fitz.open(pdf_path)
p_to = int(args[args.index('--to')+1]) if '--to' in args else doc.page_count
out = pathlib.Path('_staging') / slug
out.mkdir(parents=True, exist_ok=True)
for i in range(p_from-1, min(p_to, doc.page_count)):
    pix = doc[i].get_pixmap(dpi=150)  # 150 dpi suffit pour CHOISIR ; make_plates refait en 300
    pix.save(out / f'page-{i+1:02d}.png')
print(f'{min(p_to,doc.page_count)-p_from+1} pages -> {out}')
