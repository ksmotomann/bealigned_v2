import { Resend } from 'resend';
import { supabaseAdmin } from './supabase';

// Initialize Resend with your API key
const resend = new Resend(process.env.RESEND_API_KEY);

export class ResendEmailService {
  async sendTranscript(conversationId: string, recipientEmail: string, userId: string) {
    try {
      // Get conversation with messages
      const { data: conversation } = await supabaseAdmin
        .from('conversations')
        .select('*, messages(*)')
        .eq('id', conversationId)
        .eq('user_id', userId)
        .single();

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      // Get user profile for name
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', userId)
        .single();

      const userName = profile?.first_name 
        ? `${profile.first_name} ${profile.last_name || ''}`.trim()
        : 'User';

      // Sort messages by created_at
      const messages = conversation.messages?.sort((a: any, b: any) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ) || [];

      // Generate HTML transcript
      const htmlContent = this.generateHtmlTranscript(
        messages,
        conversation.title || 'BeAligned Conversation',
        userName
      );

      // Send email using Resend
      const { data, error } = await resend.emails.send({
        from: 'BeAligned <noreply@bealigned.com>', // You'll need to verify this domain in Resend
        to: [recipientEmail],
        subject: `Your BeAligned Transcript: ${conversation.title || 'Conversation'}`,
        html: htmlContent,
      });

      if (error) {
        throw error;
      }

      console.log('Transcript sent via Resend:', data?.id);
      return { success: true, messageId: data?.id };
    } catch (error) {
      console.error('Failed to send transcript via Resend:', error);
      throw error;
    }
  }

  private generateHtmlTranscript(messages: any[], title: string, userName: string): string {
    const messagesHtml = messages.map(msg => {
      const timestamp = new Date(msg.created_at).toLocaleString();
      const role = msg.role === 'assistant' ? 'BeAligned' : userName;
      const bgColor = msg.role === 'assistant' ? '#f0f9ff' : '#f9fafb';
      
      return `
        <div style="margin-bottom: 20px; padding: 15px; background-color: ${bgColor}; border-radius: 8px;">
          <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">${timestamp}</div>
          <div style="font-weight: 600; color: #1f2937; margin-bottom: 8px;">${role}:</div>
          <div style="color: #374151; line-height: 1.6;">${msg.content.replace(/\n/g, '<br>')}</div>
        </div>
      `;
    }).join('');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>BeAligned Transcript</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px;">
    <h1 style="margin: 0; font-size: 28px;">BeAligned Transcript</h1>
    <p style="margin: 10px 0 0 0; opacity: 0.9;">Your reflection session summary</p>
  </div>
  
  <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <div style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #e5e7eb;">
      <p style="margin: 5px 0;"><strong>Title:</strong> ${title}</p>
      <p style="margin: 5px 0;"><strong>User:</strong> ${userName}</p>
      <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date().toLocaleString()}</p>
    </div>
    
    <h2 style="color: #1f2937; margin-bottom: 20px;">Conversation</h2>
    ${messagesHtml}
  </div>
  
  <div style="margin-top: 30px; padding: 20px; background: #f9fafb; border-radius: 8px; text-align: center; color: #6b7280; font-size: 14px;">
    <p>This transcript was generated from your BeAligned session.</p>
    <p>Visit <a href="https://bealigned.app" style="color: #667eea;">bealigned.app</a> to continue your journey.</p>
  </div>
</body>
</html>
    `;
  }
}

export const resendEmailService = new ResendEmailService();