from pathlib import Path
import fitz
pdf_path = Path('attached_assets/algebra-1-course_1790460107097.pdf')
out_dir = Path('.agents/outputs')
doc = fitz.open(pdf_path)
print(f'PDF pages: {doc.page_count}')
for i in range(min(4, doc.page_count)):
    page = doc[i]
    pix = page.get_pixmap(matrix=fitz.Matrix(1.2, 1.2), alpha=False)
    out = out_dir / f'algebra-course-page-{i + 1}.png'
    pix.save(out)
    print(f'Rendered page {i + 1}: {out}')
all_text = '\n'.join(page.get_text() for page in doc)
(out_dir / 'algebra-course-extracted.txt').write_text(all_text, encoding='utf-8')
import re
for line in all_text.splitlines():
    if re.match(r'^Week [1-4] —', line) or re.match(r'^\d+\.\d+\s', line) or re.match(r'^Homework|^Midterm|^Final Exam', line):
        print(line)
