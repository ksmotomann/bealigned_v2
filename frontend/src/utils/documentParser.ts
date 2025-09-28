import * as mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

/**
 * Comprehensive document parser for multiple file formats
 * Supports: PDF, TXT, MD, HTML, CSV, DOC, DOCX, XLS, XLSX, PPT, PPTX, RTF, JSON, ODT, ODS, ODP
 */
export class DocumentParser {
  /**
   * Parse any supported document format into plain text
   */
  static async parseDocument(file: File): Promise<string> {
    const fileName = file.name.toLowerCase();
    const fileType = file.type.toLowerCase();
    
    // Determine parser based on file extension or MIME type
    if (fileName.endsWith('.txt') || fileName.endsWith('.md') || fileType.startsWith('text/')) {
      return this.parseText(file);
    } else if (fileName.endsWith('.docx') || fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      return this.parseDocx(file);
    } else if (fileName.endsWith('.doc') || fileType === 'application/msword') {
      return this.parseDoc(file);
    } else if (fileName.endsWith('.pdf') || fileType === 'application/pdf') {
      return this.parsePdf(file);
    } else if (fileName.endsWith('.xlsx') || fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      return this.parseXlsx(file);
    } else if (fileName.endsWith('.xls') || fileType === 'application/vnd.ms-excel') {
      return this.parseXls(file);
    } else if (fileName.endsWith('.csv') || fileType === 'text/csv') {
      return this.parseCsv(file);
    } else if (fileName.endsWith('.html') || fileType === 'text/html') {
      return this.parseHtml(file);
    } else if (fileName.endsWith('.json') || fileType === 'application/json') {
      return this.parseJson(file);
    } else if (fileName.endsWith('.rtf') || fileType === 'application/rtf') {
      return this.parseRtf(file);
    } else if (fileName.endsWith('.pptx') || fileType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
      return this.parsePptx(file);
    } else if (fileName.endsWith('.ppt') || fileType === 'application/vnd.ms-powerpoint') {
      return this.parsePpt(file);
    } else if (fileName.endsWith('.odt') || fileType === 'application/vnd.oasis.opendocument.text') {
      return this.parseOdt(file);
    } else if (fileName.endsWith('.ods') || fileType === 'application/vnd.oasis.opendocument.spreadsheet') {
      return this.parseOds(file);
    } else if (fileName.endsWith('.odp') || fileType === 'application/vnd.oasis.opendocument.presentation') {
      return this.parseOdp(file);
    } else {
      throw new Error(`Unsupported file format: ${fileName}`);
    }
  }

  /**
   * Parse plain text files
   */
  private static async parseText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        resolve(this.cleanText(content));
      };
      reader.onerror = reject;
      reader.readAsText(file, 'UTF-8');
    });
  }

  /**
   * Parse DOCX files using mammoth
   */
  private static async parseDocx(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const result = await mammoth.extractRawText({ arrayBuffer });
          resolve(this.cleanText(result.value));
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Parse DOC files (legacy Word)
   * Note: Full .doc support requires server-side processing
   */
  private static async parseDoc(file: File): Promise<string> {
    // For now, try to extract any readable text
    // Full support would require a library like python-docx on the server
    return this.extractReadableText(file);
  }

  /**
   * Parse PDF files
   * Note: This requires server-side processing or a heavy client library
   */
  private static async parsePdf(file: File): Promise<string> {
    // For now, we'll need to handle PDFs on the server
    // Or use a library like pdf.js which is quite heavy
    return `[PDF Processing: ${file.name}]\n\nPDF text extraction requires server-side processing. Please convert to text or use the server endpoint.`;
  }

  /**
   * Parse XLSX files using xlsx library
   */
  private static async parseXlsx(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          let text = '';
          workbook.SheetNames.forEach(sheetName => {
            text += `\n## Sheet: ${sheetName}\n\n`;
            const sheet = workbook.Sheets[sheetName];
            const csv = XLSX.utils.sheet_to_csv(sheet);
            text += csv;
          });
          
          resolve(this.cleanText(text));
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Parse XLS files (legacy Excel)
   */
  private static async parseXls(file: File): Promise<string> {
    // XLSX library can also handle .xls files
    return this.parseXlsx(file);
  }

  /**
   * Parse CSV files using PapaParse
   */
  private static async parseCsv(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        complete: (results: any) => {
          const text = results.data
            .map((row: any) => {
              if (Array.isArray(row)) {
                return row.join(' | ');
              }
              return Object.values(row).join(' | ');
            })
            .join('\n');
          resolve(this.cleanText(text));
        },
        error: reject
      });
    });
  }

  /**
   * Parse HTML files
   */
  private static async parseHtml(file: File): Promise<string> {
    const htmlText = await this.parseText(file);
    // Strip HTML tags
    const text = htmlText
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '') // Remove styles
      .replace(/<[^>]+>/g, ' ') // Remove HTML tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' '); // Normalize whitespace
    
    return this.cleanText(text);
  }

  /**
   * Parse JSON files
   */
  private static async parseJson(file: File): Promise<string> {
    const jsonText = await this.parseText(file);
    try {
      const json = JSON.parse(jsonText);
      // Convert JSON to readable text format
      return this.jsonToText(json);
    } catch (error) {
      // If not valid JSON, return as-is
      return jsonText;
    }
  }

  /**
   * Convert JSON object to readable text
   */
  private static jsonToText(obj: any, indent: string = ''): string {
    let text = '';
    
    if (typeof obj === 'string') {
      return obj;
    } else if (typeof obj === 'number' || typeof obj === 'boolean') {
      return String(obj);
    } else if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        text += `${indent}[${index}]: ${this.jsonToText(item, indent + '  ')}\n`;
      });
    } else if (typeof obj === 'object' && obj !== null) {
      Object.entries(obj).forEach(([key, value]) => {
        text += `${indent}${key}: ${this.jsonToText(value, indent + '  ')}\n`;
      });
    }
    
    return text;
  }

  /**
   * Parse RTF files
   */
  private static async parseRtf(file: File): Promise<string> {
    const rtfText = await this.parseText(file);
    // Basic RTF stripping - removes most RTF control codes
    const text = rtfText
      .replace(/\\par\b/g, '\n')
      .replace(/\\\w+\b[0-9-]*/g, '') // Remove RTF control words
      .replace(/[{}]/g, '') // Remove braces
      .replace(/\\/g, ''); // Remove backslashes
    
    return this.cleanText(text);
  }

  /**
   * Parse PowerPoint PPTX files
   */
  private static async parsePptx(file: File): Promise<string> {
    // PPTX files are zip archives with XML inside
    // For now, we'll extract any readable text
    return this.extractReadableText(file);
  }

  /**
   * Parse PowerPoint PPT files (legacy)
   */
  private static async parsePpt(file: File): Promise<string> {
    return this.extractReadableText(file);
  }

  /**
   * Parse OpenDocument Text files
   */
  private static async parseOdt(file: File): Promise<string> {
    // ODT files are zip archives with XML inside
    return this.extractReadableText(file);
  }

  /**
   * Parse OpenDocument Spreadsheet files
   */
  private static async parseOds(file: File): Promise<string> {
    return this.extractReadableText(file);
  }

  /**
   * Parse OpenDocument Presentation files
   */
  private static async parseOdp(file: File): Promise<string> {
    return this.extractReadableText(file);
  }

  /**
   * Extract any readable text from binary files
   * This is a fallback for formats we can't fully parse
   */
  private static async extractReadableText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        // Extract readable ASCII/UTF-8 text from binary content
        const readable = content
          .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ') // Remove control chars
          .replace(/[^\x20-\x7E\n\r\t]/g, '') // Keep only printable ASCII
          .replace(/\s+/g, ' ') // Normalize whitespace
          .trim();
        
        if (readable.length < 100) {
          resolve(`[${file.name}]\n\nThis file format requires specialized parsing. Content could not be extracted automatically.`);
        } else {
          resolve(this.cleanText(readable));
        }
      };
      reader.onerror = reject;
      reader.readAsText(file, 'UTF-8');
    });
  }

  /**
   * Clean and normalize text content
   */
  private static cleanText(text: string): string {
    return text
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control chars except \t \n \r
      .replace(/\u2028/g, '\n') // Replace line separator
      .replace(/\u2029/g, '\n') // Replace paragraph separator
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\n{3,}/g, '\n\n') // Limit consecutive newlines
      .trim()
      .substring(0, 1000000); // Limit to 1MB of text
  }
}