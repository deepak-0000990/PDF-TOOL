import os
import pymupdf
import docx
import openpyxl
from pptx import Presentation
from pptx.util import Inches, Pt
from PIL import Image, ImageDraw

os.makedirs("tests/assets", exist_ok=True)

# 1. Create Sample PDF 1 (3 pages)
doc1 = pymupdf.open()
for i in range(3):
    page = doc1.new_page(width=595, height=842)
    page.insert_text((50, 100), f"Sample PDF 1 - Page {i + 1}", fontsize=24, color=(0, 0, 0.8))
    page.insert_text((50, 150), f"This is sample document 1, page number {i + 1}.", fontsize=14)
    page.insert_text((50, 180), "Financial Summary Table:", fontsize=12)
    # Simple table-like text
    page.insert_text((50, 210), "Quarter\tRevenue\tProfit\nQ1\t$10,000\t$2,500\nQ2\t$15,000\t$4,000", fontsize=10)
    page.insert_text((50, 260), "CONFIDENTIAL - Internal Use Only", fontsize=12, color=(0.8, 0, 0))
doc1.save("tests/assets/sample1.pdf")
doc1.close()

# 2. Create Sample PDF 2 (2 pages)
doc2 = pymupdf.open()
for i in range(2):
    page = doc2.new_page(width=595, height=842)
    page.insert_text((50, 100), f"Sample PDF 2 - Page {i + 1}", fontsize=20, color=(0.2, 0.6, 0.2))
    page.insert_text((50, 140), "This is second PDF document to test merging, comparing and splitting.", fontsize=12)
doc2.save("tests/assets/sample2.pdf")
doc2.close()

# 3. Create Sample DOCX
d = docx.Document()
d.add_heading("Project Proposal", level=1)
d.add_paragraph("This is a genuine Word document converted to PDF.")
t = d.add_table(rows=2, cols=2)
t.cell(0, 0).text = "Item"
t.cell(0, 1).text = "Status"
t.cell(1, 0).text = "Engine"
t.cell(1, 1).text = "Active"
d.save("tests/assets/sample.docx")

# 4. Create Sample XLSX
wb = openpyxl.Workbook()
ws = wb.active
ws.title = "SalesData"
ws.append(["Month", "Units", "Amount"])
ws.append(["January", 120, 2400])
ws.append(["February", 150, 3000])
wb.save("tests/assets/sample.xlsx")

# 5. Create Sample PPTX
prs = Presentation()
slide = prs.slides.add_slide(prs.slide_layouts[0])
slide.shapes.title.text = "PDF Toolkit Presentation"
slide.placeholders[1].text = "Testing PowerPoint to PDF conversion."
prs.save("tests/assets/sample.pptx")

# 6. Create Sample JPG
img = Image.new("RGB", (600, 400), color=(73, 109, 137))
d = ImageDraw.Draw(img)
d.text((50, 50), "Sample Image for PDF", fill=(255, 255, 0))
img.save("tests/assets/sample.jpg", "JPEG")

# 7. Create Sample HTML
with open("tests/assets/sample.html", "w", encoding="utf-8") as f:
    f.write("<!DOCTYPE html><html><head><title>Test HTML</title></head><body><h1>Hello World HTML to PDF</h1><p>Rendered with Playwright Chromium.</p></body></html>")

print("All test assets generated in tests/assets/!")
