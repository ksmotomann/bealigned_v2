import nodemailer from 'nodemailer';
import { supabaseAdmin } from './supabase';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured = false;

  constructor() {
    this.initializeTransporter();
  }

  private async initializeTransporter() {
    try {
      // Check if email configuration is available in environment
      const emailConfig = {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      };

      // Only initialize if all required config is present
      if (emailConfig.host && emailConfig.auth.user && emailConfig.auth.pass) {
        this.transporter = nodemailer.createTransport(emailConfig);
        this.isConfigured = true;
        console.log('Email service initialized successfully');
      } else {
        console.log('Email service not configured - missing SMTP settings');
      }
    } catch (error) {
      console.error('Failed to initialize email service:', error);
    }
  }

  async sendNewIssueNotification(issue: any, submitter: any) {
    if (!this.isConfigured || !this.transporter) {
      console.log('Email service not configured - skipping notification');
      return;
    }

    try {
      // Get super admins
      const { data: superAdmins, error } = await supabaseAdmin
        .from('profiles')
        .select('email, first_name, last_name')
        .eq('is_super_admin', true); // Assuming you'll add this field

      if (error || !superAdmins?.length) {
        console.log('No super admins found for notification');
        return;
      }

      const submitterName = submitter.first_name && submitter.last_name 
        ? `${submitter.first_name} ${submitter.last_name}` 
        : submitter.email;

      const emailSubject = `🎯 New Issue Submitted: ${issue.title}`;
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #4F46E5; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">BeAligned™ - New Issue</h1>
          </div>
          
          <div style="padding: 20px; background-color: #f9f9f9;">
            <h2 style="color: #1F2937; margin-top: 0;">${issue.title}</h2>
            
            <div style="background-color: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <p><strong>Type:</strong> 
                <span style="background-color: ${this.getTypeColor(issue.type)}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                  ${issue.type.toUpperCase()}
                </span>
              </p>
              <p><strong>Priority:</strong> 
                <span style="background-color: ${this.getPriorityColor(issue.urgency)}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                  ${issue.urgency.toUpperCase()}
                </span>
              </p>
              <p><strong>Submitted by:</strong> ${submitterName}</p>
              <p><strong>Date:</strong> ${new Date(issue.created_at).toLocaleString()}</p>
            </div>

            ${issue.description ? `
              <div style="background-color: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <h3 style="margin-top: 0; color: #374151;">Description:</h3>
                <p style="line-height: 1.6; color: #4B5563;">${issue.description}</p>
              </div>
            ` : ''}

            ${issue.tags?.length ? `
              <div style="background-color: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <h3 style="margin-top: 0; color: #374151;">Tags:</h3>
                <p>${issue.tags.join(', ')}</p>
              </div>
            ` : ''}

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/feedback" 
                 style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                View in Admin Dashboard
              </a>
            </div>
          </div>
          
          <div style="background-color: #E5E7EB; padding: 15px; text-align: center; font-size: 12px; color: #6B7280;">
            <p>This is an automated notification from BeAligned™ Issue Tracking System</p>
          </div>
        </div>
      `;

      // Send to all super admins
      for (const admin of superAdmins) {
        await this.transporter.sendMail({
          from: `"BeAligned™" <${process.env.SMTP_USER}>`,
          to: admin.email,
          subject: emailSubject,
          html: emailHtml,
        });
      }

      console.log(`New issue notification sent to ${superAdmins.length} super admin(s)`);
    } catch (error) {
      console.error('Failed to send new issue notification:', error);
    }
  }

  private getTypeColor(type: string): string {
    const colors = {
      bug: '#EF4444',
      feature: '#F59E0B',
      improvement: '#3B82F6',
      question: '#10B981',
    };
    return colors[type as keyof typeof colors] || '#6B7280';
  }

  private getPriorityColor(priority: string): string {
    const colors = {
      low: '#6B7280',
      medium: '#3B82F6',
      high: '#F59E0B',
      critical: '#EF4444',
    };
    return colors[priority as keyof typeof colors] || '#6B7280';
  }

  // Send conversation transcript
  async sendTranscript(conversationId: string, recipientEmail: string, userId: string) {
    if (!this.isConfigured || !this.transporter) {
      console.log('Email service not configured - unable to send transcript');
      throw new Error('Email service not configured. Please contact support.');
    }

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
      const htmlTranscript = this.generateHtmlTranscript(
        messages,
        conversation.title || 'BeAligned Conversation',
        userName
      );

      // Generate text transcript for plain text version
      const textTranscript = this.generateTextTranscript(
        messages,
        conversation.title || 'BeAligned Conversation',
        userName
      );

      // Send email
      const info = await this.transporter.sendMail({
        from: `"BeAligned" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to: recipientEmail,
        subject: `Your BeAligned Transcript: ${conversation.title || 'Conversation'}`,
        text: textTranscript,
        html: htmlTranscript
      });

      console.log('Transcript email sent successfully:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Failed to send transcript email:', error);
      throw error;
    }
  }

  private generateTextTranscript(messages: any[], title: string, userName: string): string {
    const header = `BeAligned Transcript
====================================
Title: ${title}
User: ${userName}
Date: ${new Date().toLocaleString()}
====================================

`;

    const body = messages.map(msg => {
      const timestamp = new Date(msg.created_at).toLocaleString();
      const role = msg.role === 'assistant' ? 'BeAligned' : userName;
      return `[${timestamp}]
${role}: ${msg.content}

---

`;
    }).join('');

    return header + body;
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
    <p>Visit <a href="https://bealigned.com" style="color: #667eea;">bealigned.com</a> to continue your journey.</p>
  </div>
</body>
</html>
    `;
  }

  // Generic send email method
  async sendEmail(options: { to: string; subject: string; html: string }) {
    if (!this.isConfigured || !this.transporter) {
      console.log('Email service not configured - skipping email');
      return;
    }

    try {
      const info = await this.transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });

      console.log('Email sent successfully:', info.messageId);
      return info;
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }
}

export const emailService = new EmailService();