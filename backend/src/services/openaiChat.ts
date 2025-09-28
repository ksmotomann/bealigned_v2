import OpenAI from 'openai';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class OpenAIChatService {
  private supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  private async getActiveAssistantSettings() {
    const { data, error } = await this.supabase
      .from('assistant_settings')
      .select('*')
      .eq('is_active', true)
      .single();

    if (error || !data) {
      console.log('No active assistant settings found, using defaults');
      return null;
    }

    // Fetch associated knowledge files
    const { data: files } = await this.supabase
      .from('knowledge_base_files')
      .select('file_content')
      .eq('assistant_setting_id', data.id);

    if (files && files.length > 0) {
      data.knowledge_files = files;
      console.log(`Found ${files.length} knowledge files for active settings`);
    }

    return data;
  }

  private async getSystemPrompt(userTimezone?: string, firstName?: string): Promise<string> {
    const settings = await this.getActiveAssistantSettings();
    
    // Base system prompt with BeH2O framework
    let systemPrompt = `You are a compassionate AI assistant specializing in co-parenting support using the BeH2O® framework. Your role is to guide users through thoughtful reflection and constructive dialogue about co-parenting challenges.

## The BeH2O® Framework

The BeH2O® framework consists of 7 phases designed to help navigate co-parenting conversations:

1. **LET'S NAME IT** - Identify and articulate the specific situation or challenge
2. **BOUNDARIES** - Explore personal boundaries and what feels crossed or needs protection
3. **EMOTIONS** - Recognize and validate the emotions present in the situation
4. **HIDDEN NEEDS** - Uncover the underlying needs beneath the surface reactions
5. **OWNERSHIP** - Take responsibility for one's own contributions and responses
6. **REFRAME** - Shift perspective to see new possibilities and solutions
7. **NEXT STEPS** - Define concrete, actionable steps forward

## Your Approach

- Be warm, empathetic, and non-judgmental
- Ask thoughtful, open-ended questions to encourage deeper reflection
- Guide users progressively through the phases without rushing
- Validate emotions while maintaining focus on constructive outcomes
- Help users see their co-parent's perspective when appropriate
- Focus on what the user can control rather than trying to change others
- Encourage self-compassion and patience with the process

## Important Guidelines

- Never provide legal advice or recommendations about custody
- Don't take sides or make judgments about either parent
- Focus on emotional support and communication strategies
- If users express concerns about safety or abuse, acknowledge the seriousness and suggest professional resources
- Keep responses concise but thorough (2-3 paragraphs typically)
- Use the user's name when provided to personalize the experience`;

    // Add custom instructions from settings if available
    if (settings?.instructions) {
      systemPrompt = settings.instructions + '\n\n' + systemPrompt;
    }

    // Add knowledge base content if available
    if (settings?.knowledge_files && settings.knowledge_files.length > 0) {
      const knowledgeContent = settings.knowledge_files
        .filter((f: any) => f.file_content)
        .map((f: any) => f.file_content)
        .join('\n\n---\n\n');
      
      if (knowledgeContent) {
        systemPrompt += `\n\n## Knowledge Base Context\n\n${knowledgeContent}`;
        console.log(`Added knowledge base content to system prompt (${knowledgeContent.length} chars)`);
      }
    }

    return systemPrompt;
  }

  async getInitialGreeting(userTimezone?: string, firstName?: string): Promise<string> {
    const settings = await this.getActiveAssistantSettings();
    
    console.log('=== CHAT COMPLETION SETTINGS (Initial Greeting) ===');
    console.log('Active Setting Name:', settings?.name || 'Using defaults');
    console.log('Model:', settings?.model || 'gpt-4-turbo-preview');
    console.log('Temperature:', settings?.temperature ?? 0.7);
    console.log('Max Tokens:', settings?.max_tokens || 500);
    console.log('Top P:', settings?.top_p ?? 1.0);
    console.log('Knowledge Files:', settings?.knowledge_files?.length || 0);
    console.log('================================================');
    
    // Get user's local time for appropriate greeting
    const now = new Date();
    const userTime = userTimezone ? 
      new Date(now.toLocaleString("en-US", { timeZone: userTimezone })) : now;
    const hour = userTime.getHours();
    
    let timeOfDay = 'evening';
    if (hour >= 5 && hour < 12) timeOfDay = 'morning';
    else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
    else if (hour >= 17 && hour < 22) timeOfDay = 'evening';
    else timeOfDay = 'evening';

    const systemPrompt = await this.getSystemPrompt(userTimezone, firstName);
    const nameContext = firstName ? ` The user's name is ${firstName}.` : '';

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: `I'd like to start a new session.${nameContext} Please greet me appropriately for the ${timeOfDay} and begin with Phase 1: LET'S NAME IT.`
      }
    ];

    try {
      const completion = await openai.chat.completions.create({
        model: settings?.model || 'gpt-4-turbo-preview',
        messages: messages as any,
        temperature: settings?.temperature ?? 0.7,
        max_tokens: settings?.max_tokens || 500,
        top_p: settings?.top_p ?? 1.0,
      });

      const response = completion.choices[0].message.content || 
        `Good ${timeOfDay} — I'm glad you're here.

Let's begin with Phase 1: LET'S NAME IT.

What's the situation that's been sticking with you lately? No need to overthink it — just whatever has been lingering or weighing on you in your co-parenting experience.`;

      console.log('Initial greeting generated successfully');
      return response;
    } catch (error) {
      console.error('Failed to generate initial greeting:', error);
      throw error;
    }
  }

  async sendMessage(
    messages: ChatMessage[], 
    conversationId?: string,
    temperature?: number
  ): Promise<string> {
    const settings = await this.getActiveAssistantSettings();
    
    console.log('=== CHAT COMPLETION SETTINGS (Send Message) ===');
    console.log('Active Setting Name:', settings?.name || 'Using defaults');
    console.log('Model:', settings?.model || 'gpt-4-turbo-preview');
    console.log('Temperature:', temperature ?? settings?.temperature ?? 0.7);
    console.log('Max Tokens:', settings?.max_tokens || 1000);
    console.log('Top P:', settings?.top_p ?? 1.0);
    console.log('Knowledge Files:', settings?.knowledge_files?.length || 0);
    console.log('Message Count:', messages.length);
    console.log('==============================================');

    // Get refinements if conversation ID is provided
    let additionalContext = '';
    if (conversationId) {
      const refinements = await this.getConversationRefinements(conversationId);
      if (refinements.length > 0) {
        additionalContext = this.buildRefinementContext(refinements);
        console.log('Added refinements context:', additionalContext.length, 'chars');
      }
    }

    // Build the message array with system prompt
    const systemPrompt = await this.getSystemPrompt();
    const fullMessages: ChatMessage[] = [
      {
        role: 'system',
        content: systemPrompt + (additionalContext ? `\n\n${additionalContext}` : '')
      },
      ...messages
    ];

    try {
      const completion = await openai.chat.completions.create({
        model: settings?.model || 'gpt-4-turbo-preview',
        messages: fullMessages as any,
        temperature: temperature ?? settings?.temperature ?? 0.7,
        max_tokens: settings?.max_tokens || 1000,
        top_p: settings?.top_p ?? 1.0,
      });

      const response = completion.choices[0].message.content || 
        'I apologize, but I was unable to generate a response. Please try again.';

      console.log('Message response generated successfully');
      return response;
    } catch (error) {
      console.error('Failed to generate response:', error);
      throw error;
    }
  }

  private async getConversationRefinements(conversationId: string) {
    const { data: messages } = await this.supabase
      .from('messages')
      .select('id')
      .eq('conversation_id', conversationId);
    
    if (!messages || messages.length === 0) {
      return [];
    }

    const messageIds = messages.map((m: any) => m.id);
    
    const { data, error } = await this.supabase
      .from('refinements')
      .select('*, messages!refinements_message_id_fkey(content, role)')
      .eq('is_active', true)
      .in('message_id', messageIds)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error fetching refinements:', error);
      return [];
    }

    return data || [];
  }

  private buildRefinementContext(refinements: any[]) {
    if (!refinements.length) return '';

    const guidance = refinements.map(r => {
      const type = r.refinement_type;
      if (type === 'guidance') {
        return `Guidance: ${r.refined_content}`;
      } else if (type === 'correction') {
        const originalSnippet = r.messages?.content?.substring(0, 50) || r.original_content?.substring(0, 50) || 'previous response';
        return `Correction noted: Instead of "${originalSnippet}...", consider: "${r.refined_content}"`;
      } else if (type === 'missing_prompt') {
        return `IMPORTANT - Missing follow-up that should have been asked here: "${r.refined_content}"\n${r.notes ? `Context: ${r.notes}` : 'The AI should probe deeper or ask clarifying questions like this when similar situations arise.'}`;
      } else {
        return `Alternative approach: ${r.refined_content}`;
      }
    }).join('\n');

    return `## Admin Refinements for Context\n(Use these as guidance, not exact responses)\n\n${guidance}`;
  }

  async generateConversationTitle(messages: ChatMessage[]): Promise<string> {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Generate a brief, descriptive title (max 4-5 words) that captures the main issue or topic being discussed. Focus on the problem or challenge mentioned. Return only the title, no quotes or punctuation.'
          },
          {
            role: 'user',
            content: `Based on this conversation, generate a title:\n\n${messages.slice(-4).map(m => `${m.role}: ${m.content.substring(0, 200)}`).join('\n')}`
          }
        ] as any,
        max_tokens: 20,
        temperature: 0.7
      });
      
      return completion.choices[0].message.content?.trim() || 'Co-parenting Conversation';
    } catch (error) {
      console.error('Failed to generate title:', error);
      return 'Co-parenting Conversation';
    }
  }
}

export const openaiChatService = new OpenAIChatService();