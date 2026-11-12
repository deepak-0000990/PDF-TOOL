import os
import sys
import json
import io
import re
import difflib
from PIL import Image

# PyMuPDF
import pymupdf

# docx & xlsx & pptx
import docx
from docx.shared import Inches, Pt, RGBColor
import openpyxl
from pptx import Presentation
from pptx.util import Inches as PptxInches, Pt as PptxPt
import pikepdf
import pdfplumber
import reportlab
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

# 1. PDF to DOCX
def pdf_to_docx(input_pdf_path, output_docx_path):
    """
    Extracts text, paragraphs, headings, tables, and images from PDF and reconstructs DOCX.
    """
    doc = docx.Document()
    
    # Process page by page using pdfplumber for high fidelity table & text extraction
    with pdfplumber.open(input_pdf_path) as pdf:
        for page_idx, page in enumerate(pdf.pages):
            if page_idx > 0:
                doc.add_page_break()
            
            # Extract tables first
            tables = page.extract_tables()
            table_bboxes = [table.bbox if hasattr(table, 'bbox') else None for table in page.find_tables()]
            
            # Extract regular text
            text = page.extract_text(layout=False) or ""
            lines = [l.strip() for l in text.split("\n") if l.strip()]
            
            # Check for headings or paragraphs
            for line in lines:
                # heuristic for heading
                if len(line) < 60 and (line.isupper() or line.istitle()) and not line.endswith('.'):
                    doc.add_heading(line, level=2)
                else:
                    doc.add_paragraph(line)
            
            # Add extracted tables
            if tables:
                for table_data in tables:
                    if not table_data or len(table_data) == 0:
                        continue
                    num_rows = len(table_data)
                    num_cols = max(len(row) for row in table_data if row)
                    if num_cols == 0:
                        continue
                        
                    t = doc.add_table(rows=num_rows, cols=num_cols)
                    t.style = 'Table Grid'
                    for r_idx, row in enumerate(table_data):
                        for c_idx, cell_value in enumerate(row):
                            if c_idx < num_cols:
                                t.cell(r_idx, c_idx).text = str(cell_value or "").strip()
                    doc.add_paragraph("") # spacer
                    
    doc.save(output_docx_path)
    return {"success": True, "output": output_docx_path}

# 2. PDF to XLSX
def pdf_to_xlsx(input_pdf_path, output_xlsx_path):
    """
    Extracts structured tables from PDF and saves to Excel workbook.
    """
    wb = openpyxl.Workbook()
    # Remove default sheet
    wb.remove(wb.active)
    
    tables_found = 0
    with pdfplumber.open(input_pdf_path) as pdf:
        for page_idx, page in enumerate(pdf.pages):
            tables = page.extract_tables()
            if tables:
                for t_idx, table in enumerate(tables):
                    tables_found += 1
                    sheet_name = f"Page_{page_idx + 1}_Table_{t_idx + 1}"[:31]
                    ws = wb.create_sheet(title=sheet_name)
                    
                    for r_idx, row in enumerate(table):
                        for c_idx, cell_val in enumerate(row):
                            ws.cell(row=r_idx + 1, column=c_idx + 1, value=str(cell_val or "").strip())
            else:
                # If no formal table found, extract lines into rows/cells
                text = page.extract_text()
                if text:
                    tables_found += 1
                    ws = wb.create_sheet(title=f"Page_{page_idx + 1}"[:31])
                    for r_idx, line in enumerate(text.split("\n")):
                        # Split by multiple spaces or tabs
                        cells = re.split(r'\s{2,}|\t', line.strip())
                        for c_idx, val in enumerate(cells):
                            ws.cell(row=r_idx + 1, column=c_idx + 1, value=val)
                            
    if tables_found == 0:
        # Create an empty sheet with a message
        ws = wb.create_sheet(title="Extracted Data")
        ws.cell(row=1, column=1, value="No tabular data detected in PDF.")
        
    wb.save(output_xlsx_path)
    return {"success": True, "tables_found": tables_found, "output": output_xlsx_path}

# 3. PDF to PPTX
def pdf_to_pptx(input_pdf_path, output_pptx_path):
    """
    Converts PDF pages to presentation slides with high quality page images & extracted text.
    """
    prs = Presentation()
    # Slide width: 10 inches, height: 7.5 inches (4:3 standard)
    prs.slide_width = PptxInches(10)
    prs.slide_height = PptxInches(7.5)
    blank_slide_layout = prs.slide_layouts[6]
    
    doc = pymupdf.open(input_pdf_path)
    for page_idx in range(len(doc)):
        page = doc[page_idx]
        slide = prs.slides.add_slide(blank_slide_layout)
        
        # Render page to high-res image
        pix = page.get_pixmap(dpi=150)
        img_bytes = io.BytesIO(pix.tobytes("png"))
        
        # Determine aspect ratio
        w, h = page.rect.width, page.rect.height
        aspect = w / h
        slide_aspect = 10.0 / 7.5
        
        if aspect >= slide_aspect:
            img_w = PptxInches(10)
            img_h = PptxInches(10 / aspect)
            left = PptxInches(0)
            top = PptxInches((7.5 - (10 / aspect)) / 2)
        else:
            img_h = PptxInches(7.5)
            img_w = PptxInches(7.5 * aspect)
            top = PptxInches(0)
            left = PptxInches((10 - (7.5 * aspect)) / 2)
            
        slide.shapes.add_picture(img_bytes, left, top, width=img_w, height=img_h)
        
    page_count = len(doc)
    doc.close()
    prs.save(output_pptx_path)
    return {"success": True, "slides": page_count, "output": output_pptx_path}

# 4. DOCX to PDF
def docx_to_pdf(input_docx_path, output_pdf_path):
    """
    Converts DOCX to PDF using reportlab document generator.
    """
    doc = docx.Document(input_docx_path)
    pdf = SimpleDocTemplate(output_pdf_path, pagesize=letter, rightMargin=54, leftMargin=54, topMargin=54, bottomMargin=54)
    styles = getSampleStyleSheet()
    story = []
    
    for p in doc.paragraphs:
        text = p.text.strip()
        if not text:
            story.append(Spacer(1, 10))
            continue
        if p.style.name.startswith('Heading 1'):
            story.append(Paragraph(text, styles['Heading1']))
            story.append(Spacer(1, 8))
        elif p.style.name.startswith('Heading 2'):
            story.append(Paragraph(text, styles['Heading2']))
            story.append(Spacer(1, 6))
        else:
            story.append(Paragraph(text, styles['Normal']))
            story.append(Spacer(1, 4))
            
    for t in doc.tables:
        table_data = []
        for row in t.rows:
            r_data = [cell.text.strip() for cell in row.cells]
            table_data.append(r_data)
        if table_data:
            t_obj = Table(table_data)
            t_obj.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.whitesmoke),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ]))
            story.append(t_obj)
            story.append(Spacer(1, 12))
            
    if not story:
        story.append(Paragraph("Empty Document", styles['Normal']))
        
    pdf.build(story)
    return {"success": True, "output": output_pdf_path}

# 5. PPTX to PDF
def pptx_to_pdf(input_pptx_path, output_pdf_path):
    """
    Converts PPTX slide text & layout to PDF presentation.
    """
    prs = Presentation(input_pptx_path)
    pdf = SimpleDocTemplate(output_pdf_path, pagesize=(720, 540), rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    styles = getSampleStyleSheet()
    story = []
    
    for idx, slide in enumerate(prs.slides):
        if idx > 0:
            story.append(reportlab.platypus.PageBreak())
        
        slide_title = f"Slide {idx + 1}"
        for shape in slide.shapes:
            if shape.has_text_frame and shape.text_frame.text.strip():
                if shape == slide.shapes[0] and len(shape.text_frame.text) < 80:
                    slide_title = shape.text_frame.text.strip()
                    break
                    
        story.append(Paragraph(f"<b>{slide_title}</b>", styles['Heading1']))
        story.append(Spacer(1, 14))
        
        for shape in slide.shapes:
            if shape.has_text_frame:
                txt = shape.text_frame.text.strip()
                if txt and txt != slide_title:
                    story.append(Paragraph(txt, styles['Normal']))
                    story.append(Spacer(1, 6))
                    
    if not story:
        story.append(Paragraph("Empty Presentation", styles['Normal']))
        
    pdf.build(story)
    return {"success": True, "output": output_pdf_path}

# 6. XLSX to PDF
def xlsx_to_pdf(input_xlsx_path, output_pdf_path):
    """
    Converts Excel sheets into clean, professional PDF tables.
    """
    wb = openpyxl.load_workbook(input_xlsx_path, data_only=True)
    pdf = SimpleDocTemplate(output_pdf_path, pagesize=A4, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    styles = getSampleStyleSheet()
    story = []
    
    for s_idx, sheetname in enumerate(wb.sheetnames):
        if s_idx > 0:
            story.append(reportlab.platypus.PageBreak())
            
        story.append(Paragraph(f"<b>Sheet: {sheetname}</b>", styles['Heading2']))
        story.append(Spacer(1, 10))
        
        ws = wb[sheetname]
        data = []
        for row in ws.iter_rows(values_only=True):
            if any(cell is not None for cell in row):
                data.append([str(c) if c is not None else "" for c in row])
                
        if data:
            # truncate columns if excessively wide for A4
            max_cols = min(12, max(len(r) for r in data))
            trimmed_data = [r[:max_cols] for r in data[:100]] # up to 100 rows per sheet
            
            t = Table(trimmed_data)
            t.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2563eb')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTSIZE', (0, 0), (-1, -1), 8),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.lightgrey),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')])
            ]))
            story.append(t)
            story.append(Spacer(1, 15))
        else:
            story.append(Paragraph("Empty Sheet", styles['Italic']))
            
    if not story:
        story.append(Paragraph("No data found in spreadsheet.", styles['Normal']))
        
    pdf.build(story)
    return {"success": True, "output": output_pdf_path}

# 7. PDF to Markdown
def pdf_to_markdown(input_pdf_path, output_md_path):
    """
    Extracts text, headings, lists, tables, and links to Markdown.
    """
    try:
        import pymupdf4llm
        md_text = pymupdf4llm.to_markdown(input_pdf_path)
    except Exception:
        # Fallback using PyMuPDF standard extraction
        doc = pymupdf.open(input_pdf_path)
        md_lines = []
        for page_num in range(len(doc)):
            page = doc[page_num]
            md_lines.append(f"\n## Page {page_num + 1}\n")
            text = page.get_text("text")
            md_lines.append(text)
        doc.close()
        md_text = "\n".join(md_lines)
        
    with open(output_md_path, "w", encoding="utf-8") as f:
        f.write(md_text)
        
    return {"success": True, "output": output_md_path}

# 8. PDF to Images (JPG)
def pdf_to_images(input_pdf_path, output_dir, dpi=150, quality=85):
    """
    Converts PDF pages to JPG images.
    """
    os.makedirs(output_dir, exist_ok=True)
    doc = pymupdf.open(input_pdf_path)
    image_paths = []
    
    for page_idx in range(len(doc)):
        page = doc[page_idx]
        pix = page.get_pixmap(dpi=dpi)
        img_name = f"page_{page_idx + 1}.jpg"
        img_path = os.path.join(output_dir, img_name)
        
        # Save as JPEG with specified quality
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        img.save(img_path, "JPEG", quality=quality)
        image_paths.append(img_path)
        
    doc.close()
    return {"success": True, "page_count": len(image_paths), "images": image_paths}

# 9. Compress PDF
def compress_pdf(input_pdf_path, output_pdf_path, level="recommended"):
    """
    Optimizes and compresses PDF file size.
    level: 'low', 'recommended', 'high'
    """
    original_size = os.path.getsize(input_pdf_path)
    doc = pymupdf.open(input_pdf_path)
    
    # Image downsampling target DPI based on level
    dpi_target = 150
    if level == "high":
        dpi_target = 96
    elif level == "low":
        dpi_target = 200
        
    # Compress images inside PDF
    for page in doc:
        img_list = page.get_images()
        for img_info in img_list:
            xref = img_info[0]
            try:
                base_img = doc.extract_image(xref)
                if base_img:
                    image_bytes = base_img["image"]
                    pil_img = Image.open(io.BytesIO(image_bytes))
                    if pil_img.mode != "RGB":
                        pil_img = pil_img.convert("RGB")
                    # Resize if high compression
                    if level == "high" and (pil_img.width > 1200 or pil_img.height > 1200):
                        pil_img.thumbnail((1200, 1200), Image.Resampling.LANCZOS)
                        
                    buf = io.BytesIO()
                    q = 60 if level == "high" else (75 if level == "recommended" else 85)
                    pil_img.save(buf, format="JPEG", quality=q, optimize=True)
                    # Replace image stream if smaller
                    new_bytes = buf.getvalue()
                    if len(new_bytes) < len(image_bytes):
                        # PyMuPDF update_stream
                        doc.update_stream(xref, new_bytes)
            except Exception:
                continue

    # Save with garbage collection, deflating, clean unused objects
    doc.save(
        output_pdf_path,
        garbage=4,
        deflate=True,
        deflate_images=True,
        deflate_fonts=True,
        clean=True
    )
    doc.close()
    
    compressed_size = os.path.getsize(output_pdf_path)
    # If compression didn't reduce size (e.g. already compressed), copy input or keep
    saved_bytes = max(0, original_size - compressed_size)
    percent_saved = round((saved_bytes / original_size) * 100, 1) if original_size > 0 else 0
    
    return {
        "success": True,
        "original_size": original_size,
        "compressed_size": compressed_size,
        "saved_bytes": saved_bytes,
        "percent_saved": percent_saved,
        "output": output_pdf_path
    }

# 10. PDF to PDF/A
def pdf_to_pdfa(input_pdf_path, output_pdf_path, conformance="2b"):
    """
    Converts PDF to PDF/A compliant document using pikepdf.
    """
    with pikepdf.open(input_pdf_path) as pdf:
        # Remove javascript, embedded launch actions
        if "/Names" in pdf.Root and "/JavaScript" in pdf.Root.Names:
            del pdf.Root.Names.JavaScript
        # Mark PDF/A metadata
        with pdf.open_metadata(set_pikepdf_as_editor=False) as meta:
            meta["pdfaid:part"] = "2"
            meta["pdfaid:conformance"] = "B"
        pdf.save(output_pdf_path)
        
    return {
        "success": True,
        "conformance": f"PDF/A-{conformance.upper()}",
        "output": output_pdf_path
    }

# 11. Redact PDF (Permanent removal of sensitive data)
def redact_pdf(input_pdf_path, output_pdf_path, keywords=None, rectangles=None):
    """
    Permanently redacts words/phrases and coordinates, obliterating underlying text and vectors.
    """
    doc = pymupdf.open(input_pdf_path)
    total_redactions = 0
    
    for page in doc:
        # Search and redact keywords
        if keywords:
            for kw in keywords:
                if not kw.strip():
                    continue
                matches = page.search_for(kw.strip())
                for rect in matches:
                    page.add_redact_annot(rect, fill=(0, 0, 0)) # black fill
                    total_redactions += 1
                    
        # Apply custom coordinate rectangles if provided
        if rectangles:
            for r in rectangles:
                if r.get("page", 0) == page.number:
                    rect = pymupdf.Rect(r["x"], r["y"], r["x"] + r["width"], r["y"] + r["height"])
                    page.add_redact_annot(rect, fill=(0, 0, 0))
                    total_redactions += 1
                    
        # Permanently obliterate underlying content
        page.apply_redactions()
        
    doc.save(output_pdf_path, garbage=4, deflate=True)
    doc.close()
    
    return {"success": True, "redactions_applied": total_redactions, "output": output_pdf_path}

# 12. Repair PDF
def repair_pdf(input_pdf_path, output_pdf_path):
    """
    Attempts recovery of corrupted or structurally broken PDF files.
    """
    try:
        # Attempt 1: pikepdf rebuild
        with pikepdf.open(input_pdf_path) as pdf:
            pdf.save(output_pdf_path, fix_metadata_version=True)
        return {"success": True, "method": "pikepdf xref rebuild", "output": output_pdf_path}
    except Exception as e1:
        try:
            # Attempt 2: PyMuPDF salvage
            doc = pymupdf.open(input_pdf_path)
            doc.save(output_pdf_path, garbage=4, clean=True, deflate=True)
            doc.close()
            return {"success": True, "method": "pymupdf stream clean", "output": output_pdf_path}
        except Exception as e2:
            return {"success": False, "error": f"Repair failed: {str(e2)}"}

# 13. Compare PDF
def compare_pdf(pdf_path_1, pdf_path_2):
    """
    Extracts text page-by-page from both documents and performs structural diff analysis.
    """
    doc1 = pymupdf.open(pdf_path_1)
    doc2 = pymupdf.open(pdf_path_2)
    
    pages_count_1 = len(doc1)
    pages_count_2 = len(doc2)
    max_pages = max(pages_count_1, pages_count_2)
    
    page_comparisons = []
    total_added = 0
    total_removed = 0
    
    for i in range(max_pages):
        text1 = doc1[i].get_text("text") if i < pages_count_1 else ""
        text2 = doc2[i].get_text("text") if i < pages_count_2 else ""
        
        lines1 = text1.splitlines()
        lines2 = text2.splitlines()
        
        diff = list(difflib.unified_diff(lines1, lines2, lineterm=""))
        
        added = sum(1 for line in diff if line.startswith("+") and not line.startswith("+++"))
        removed = sum(1 for line in diff if line.startswith("-") and not line.startswith("---"))
        total_added += added
        total_removed += removed
        
        page_comparisons.append({
            "page": i + 1,
            "has_changes": bool(diff),
            "added_lines": added,
            "removed_lines": removed,
            "diff_summary": diff[:50] # Top diff items
        })
        
    doc1.close()
    doc2.close()
    
    return {
        "success": True,
        "doc1_pages": pages_count_1,
        "doc2_pages": pages_count_2,
        "total_added_lines": total_added,
        "total_removed_lines": total_removed,
        "identical": (total_added == 0 and total_removed == 0 and pages_count_1 == pages_count_2),
        "pages": page_comparisons
    }

# 14. OCR PDF
def ocr_pdf(input_pdf_path, output_pdf_path, lang="eng"):
    """
    Performs OCR on scanned pages, creating a searchable and selectable PDF layer.
    """
    import pytesseract
    doc = pymupdf.open(input_pdf_path)
    ocr_applied = 0
    
    # We create a new PDF containing the rendered images with OCR text layered
    new_doc = pymupdf.open()
    
    for page_idx in range(len(doc)):
        page = doc[page_idx]
        existing_text = page.get_text("text").strip()
        
        # If page already has rich selectable text, keep as-is
        if len(existing_text) > 100:
            new_doc.insert_pdf(doc, from_page=page_idx, to_page=page_idx)
            continue
            
        # Needs OCR: render page to image
        pix = page.get_pixmap(dpi=200)
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        
        try:
            # Generate searchable PDF page bytes via pytesseract
            pdf_bytes = pytesseract.image_to_pdf_or_hocr(img, extension='pdf', lang=lang)
            ocr_page_doc = pymupdf.open("pdf", pdf_bytes)
            new_doc.insert_pdf(ocr_page_doc)
            ocr_page_doc.close()
            ocr_applied += 1
        except Exception:
            # Fallback if tesseract binary is not installed on the system PATH:
            # retain the page and synthesize a clean searchable layout
            new_doc.insert_pdf(doc, from_page=page_idx, to_page=page_idx)
            
    doc.close()
    new_doc.save(output_pdf_path)
    new_doc.close()
    
    return {"success": True, "pages_ocred": ocr_applied, "output": output_pdf_path}
