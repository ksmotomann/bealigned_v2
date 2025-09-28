import jsPDF from 'jspdf';

interface Message {
  role: string;
  content: string;
  created_at: string;
}

export const exportChatToText = (messages: Message[], title: string) => {
  const transcript = messages.map(msg => {
    const timestamp = new Date(msg.created_at).toLocaleString();
    const role = msg.role === 'assistant' ? 'BeAligned' : 'You';
    return `[${timestamp}]\n${role}: ${msg.content}\n`;
  }).join('\n---\n\n');

  const fullText = `BeAligned Transcript: ${title}\nGenerated: ${new Date().toLocaleString()}\n\n===\n\n${transcript}`;
  
  const blob = new Blob([fullText], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bealigned-transcript-${Date.now()}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const exportChatToPDF = (messages: Message[], title: string) => {
  const doc = new jsPDF();
  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;
  const margins = { top: 20, bottom: 20, left: 15, right: 15 };
  const contentWidth = pageWidth - margins.left - margins.right;
  let yPosition = margins.top;

  // Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`BeAligned Transcript: ${title}`, margins.left, yPosition);
  yPosition += 10;

  // Date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleString()}`, margins.left, yPosition);
  yPosition += 15;

  // Messages
  messages.forEach((msg) => {
    // Check if we need a new page
    if (yPosition > pageHeight - margins.bottom - 20) {
      doc.addPage();
      yPosition = margins.top;
    }

    // Timestamp and role
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    const timestamp = new Date(msg.created_at).toLocaleString();
    const role = msg.role === 'assistant' ? 'BeAligned' : 'You';
    doc.text(`[${timestamp}] ${role}:`, margins.left, yPosition);
    yPosition += 7;

    // Message content
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(msg.content, contentWidth);
    
    lines.forEach((line: string) => {
      if (yPosition > pageHeight - margins.bottom) {
        doc.addPage();
        yPosition = margins.top;
      }
      doc.text(line, margins.left, yPosition);
      yPosition += 5;
    });

    yPosition += 5; // Space between messages
  });

  doc.save(`bealigned-transcript-${Date.now()}.pdf`);
};