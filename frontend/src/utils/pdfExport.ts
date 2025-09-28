import jsPDF from 'jspdf';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  session_duration_minutes?: number;
  user?: {
    email: string;
    first_name?: string;
    last_name?: string;
  };
}

// Helper function to clean text for PDF
const cleanTextForPDF = (text: string): string => {
  return text
    // Replace smart quotes and dashes
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .replace(/[–—]/g, '-')
    // Handle markdown-style formatting
    .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
    .replace(/\*(.*?)\*/g, '$1') // Italic
    .replace(/`(.*?)`/g, '$1') // Code
    .replace(/#{1,6}\s/g, '') // Headers
    // Remove or replace emojis
    .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '[emoji]')
    // Replace problematic Unicode characters
    .replace(/[\u{2000}-\u{206F}]/gu, ' ') // General punctuation
    .replace(/[\u{2E00}-\u{2E7F}]/gu, ' ') // Supplemental punctuation
    .replace(/[\u{3000}-\u{303F}]/gu, ' ') // CJK symbols
    .replace(/[\u{FE00}-\u{FE0F}]/gu, '') // Variation selectors
    .replace(/[\u{200B}-\u{200D}]/gu, '') // Zero-width characters
    // Clean up multiple spaces and normalize
    .replace(/\s+/g, ' ')
    .replace(/\t/g, '    ') // Convert tabs to spaces
    .trim();
};

export const exportChatToPDF = async (
  conversation: Conversation,
  messages: Message[]
): Promise<void> => {
  const pdf = new jsPDF({
    format: 'a4',
    unit: 'pt'
  });
  
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - (2 * margin);
  let yPosition = margin;

  // Helper function to add text with word wrapping
  const addText = (text: string, x: number, y: number, options: any = {}) => {
    const fontSize = options.fontSize || 10;
    const maxWidth = options.maxWidth || (pageWidth - 2 * margin);
    const lineHeight = options.lineHeight || fontSize * 1.2;
    
    // Clean the text before processing
    const cleanedText = cleanTextForPDF(text);
    
    pdf.setFontSize(fontSize);
    if (options.fontStyle) {
      pdf.setFont('helvetica', options.fontStyle);
    } else {
      pdf.setFont('helvetica', 'normal');
    }
    
    // Split text into lines with proper word wrapping
    const lines = pdf.splitTextToSize(cleanedText, maxWidth);
    
    // Check if we need a new page
    if (y + (lines.length * lineHeight) > pageHeight - margin) {
      pdf.addPage();
      y = margin;
    }
    
    lines.forEach((line: string, index: number) => {
      // Clean each line again to be safe
      const cleanLine = cleanTextForPDF(line);
      try {
        pdf.text(cleanLine, x, y + (index * lineHeight));
      } catch (error) {
        console.warn('Error adding line to PDF, skipping:', error);
        // Add a placeholder for problematic text
        pdf.text('[Text encoding error]', x, y + (index * lineHeight));
      }
    });
    
    return y + (lines.length * lineHeight) + (options.spacing || 5);
  };

  // Header
  pdf.setFillColor(79, 70, 229); // Indigo
  pdf.rect(0, 0, pageWidth, 40, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('BeAligned™ Chat Transcript', margin, 25);
  
  yPosition = 55;
  pdf.setTextColor(0, 0, 0);

  // Conversation Details
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Session Details', margin, yPosition);
  yPosition += 15;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  
  // Session info
  const sessionInfo = [
    `Title: ${cleanTextForPDF(conversation.title)}`,
    `User: ${conversation.user ? cleanTextForPDF(`${conversation.user.first_name || ''} ${conversation.user.last_name || ''} (${conversation.user.email})`.trim()) : 'Unknown'}`,
    `Started: ${new Date(conversation.created_at).toLocaleString()}`,
    conversation.completed_at ? `Completed: ${new Date(conversation.completed_at).toLocaleString()}` : `Last Activity: ${new Date(conversation.updated_at).toLocaleString()}`,
    conversation.session_duration_minutes ? `Duration: ${conversation.session_duration_minutes} minutes` : '',
    `Messages: ${messages.length}`,
    `Conversation ID: ${conversation.id}`,
    `Generated: ${new Date().toLocaleString()}`
  ].filter(Boolean);

  sessionInfo.forEach((info) => {
    yPosition = addText(info, margin, yPosition, { fontSize: 10, spacing: 3 });
  });

  yPosition += 10;

  // Messages
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Conversation', margin, yPosition);
  yPosition += 15;

  messages.forEach((message, index) => {
    // Check if we need a new page
    if (yPosition > pageHeight - 80) {
      pdf.addPage();
      yPosition = margin;
    }

    const timestamp = new Date(message.created_at).toLocaleString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const isUser = message.role === 'user';
    const roleLabel = isUser ? 'User' : 'BeAligned™ Assistant';
    const roleColor = isUser ? [59, 130, 246] : [16, 185, 129]; // Blue for user, green for assistant

    // Role header with background
    pdf.setFillColor(roleColor[0], roleColor[1], roleColor[2]);
    pdf.rect(margin, yPosition - 8, maxWidth, 16, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${roleLabel} - ${timestamp}`, margin + 5, yPosition + 2);
    
    yPosition += 18;
    pdf.setTextColor(0, 0, 0);

    // Message content - clean and process
    const messageContent = cleanTextForPDF(message.content);
    
    // Split long messages into paragraphs for better readability
    const paragraphs = messageContent.split('\n\n').filter(p => p.trim());
    
    paragraphs.forEach((paragraph, pIndex) => {
      yPosition = addText(paragraph.trim(), margin + 5, yPosition, {
        fontSize: 10,
        maxWidth: maxWidth - 10,
        spacing: pIndex === paragraphs.length - 1 ? 20 : 10, // More spacing after messages
        lineHeight: 12
      });
    });
  });

  // Footer
  const totalPages = (pdf as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(128, 128, 128);
    pdf.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 30, pageHeight - 10);
    pdf.text('BeAligned™ - Confidential', margin, pageHeight - 10);
  }

  // Generate filename with timestamp for uniqueness
  const userName = conversation.user 
    ? cleanTextForPDF(`${conversation.user.first_name || ''} ${conversation.user.last_name || ''}`)
        .replace(/\s+/g, '_')
        .replace(/[^a-zA-Z0-9_]/g, '')
        .substring(0, 20) // Limit length
    : 'Unknown';
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const timeStr = now.toISOString().split('T')[1].replace(/:/g, '-').split('.')[0]; // HH-MM-SS
  const shortId = conversation.id.substring(0, 8);
  const filename = `BeAligned_Chat_${userName}_${dateStr}_${timeStr}_${shortId}.pdf`;

  // Download the PDF
  pdf.save(filename);
};