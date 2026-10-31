import PyPDF2
import docx

def extract_text(file, filename):
    """
    Extracts text from a given file object (PDF or DOCX).
    """
    text = ""
    try:
        if filename.endswith('.pdf'):
            reader = PyPDF2.PdfReader(file)
            for page in reader.pages:
                text += page.extract_text() + "\n"
        elif filename.endswith('.docx'):
            doc = docx.Document(file)
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
        else:
            text = "Unsupported file format."
    except Exception as e:
        print(f"Error parsing file: {e}")
        text = "Error extracting text."
    
    return text.strip()
