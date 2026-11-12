import sys
import json
import os
import converters
import ai_tools

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No command provided"}))
        sys.exit(1)
        
    command = sys.argv[1]
    
    # Read payload from argument 2 or stdin
    payload = {}
    if len(sys.argv) > 2:
        try:
            payload = json.loads(sys.argv[2])
        except Exception:
            payload = {}
    elif not sys.stdin.isatty():
        try:
            payload = json.loads(sys.stdin.read())
        except Exception:
            payload = {}
            
    try:
        result = {}
        if command == "pdf_to_docx":
            result = converters.pdf_to_docx(payload["input"], payload["output"])
        elif command == "pdf_to_xlsx":
            result = converters.pdf_to_xlsx(payload["input"], payload["output"])
        elif command == "pdf_to_pptx":
            result = converters.pdf_to_pptx(payload["input"], payload["output"])
        elif command == "docx_to_pdf":
            result = converters.docx_to_pdf(payload["input"], payload["output"])
        elif command == "pptx_to_pdf":
            result = converters.pptx_to_pdf(payload["input"], payload["output"])
        elif command == "xlsx_to_pdf":
            result = converters.xlsx_to_pdf(payload["input"], payload["output"])
        elif command == "pdf_to_markdown":
            result = converters.pdf_to_markdown(payload["input"], payload["output"])
        elif command == "pdf_to_images":
            result = converters.pdf_to_images(
                payload["input"], 
                payload["output_dir"], 
                payload.get("dpi", 150), 
                payload.get("quality", 85)
            )
        elif command == "compress_pdf":
            result = converters.compress_pdf(payload["input"], payload["output"], payload.get("level", "recommended"))
        elif command == "pdf_to_pdfa":
            result = converters.pdf_to_pdfa(payload["input"], payload["output"], payload.get("conformance", "2b"))
        elif command == "redact_pdf":
            result = converters.redact_pdf(payload["input"], payload["output"], payload.get("keywords"), payload.get("rectangles"))
        elif command == "repair_pdf":
            result = converters.repair_pdf(payload["input"], payload["output"])
        elif command == "compare_pdf":
            result = converters.compare_pdf(payload["input1"], payload["input2"])
        elif command == "ocr_pdf":
            result = converters.ocr_pdf(payload["input"], payload["output"], payload.get("lang", "eng"))
        elif command == "ai_summarize":
            result = ai_tools.ai_summarize(payload.get("input"), payload.get("text"), payload.get("summary_type"))
        elif command == "ai_translate":
            result = ai_tools.ai_translate(payload["input"], payload["output"], payload.get("target_lang", "Spanish"))
        else:
            result = {"error": f"Unknown command: {command}"}
            
        print(json.dumps(result))
    except Exception as e:
        import traceback
        print(json.dumps({
            "error": str(e),
            "traceback": traceback.format_exc()
        }))
        sys.exit(1)

if __name__ == "__main__":
    main()
