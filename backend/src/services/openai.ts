import OpenAI from 'openai';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const assistantId = process.env.OPENAI_ASSISTANT_ID!;

export class OpenAIService {
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

    // Fetch associated knowledge files with OpenAI file IDs
    const { data: files } = await this.supabase
      .from('knowledge_base_files')
      .select('openai_file_id, file_content')
      .eq('assistant_setting_id', data.id)
      .not('openai_file_id', 'is', null);

    if (files && files.length > 0) {
      data.knowledge_files = files;
      console.log(`Found ${files.length} knowledge files for active settings`);
    }

    return data;
  }
  async createThread() {
    const thread = await openai.beta.threads.create();
    return thread.id;
  }

  async getInitialGreeting(threadId: string, userTimezone?: string, firstName?: string) {
    // Get active assistant settings
    const settings = await this.getActiveAssistantSettings();
    
    console.log('=== ASSISTANT SETTINGS BEING APPLIED (Initial Greeting) ===');
    console.log('Active Setting Name:', settings?.name || 'Using defaults');
    console.log('Model:', settings?.model || 'default');
    console.log('Temperature:', settings?.temperature ?? 'default');
    console.log('Max Tokens:', settings?.max_tokens || 'default');
    console.log('Top P:', settings?.top_p ?? 'default');
    console.log('Knowledge Files:', settings?.knowledge_files?.length || 0);
    console.log('=========================================================');
    
    // Get user's local time for appropriate greeting
    const now = new Date();
    const userTime = userTimezone ? 
      new Date(now.toLocaleString("en-US", { timeZone: userTimezone })) : now;
    const hour = userTime.getHours();
    
    let timeOfDay = 'evening';
    if (hour >= 5 && hour < 12) timeOfDay = 'morning';
    else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
    else if (hour >= 17 && hour < 22) timeOfDay = 'evening';
    else timeOfDay = 'evening'; // Use "evening" for late night hours too
    
    // Send a simple trigger message
    const nameContext = firstName ? ` The user's name is ${firstName}.` : '';
    
    await openai.beta.threads.messages.create(threadId, {
      role: 'user',
      content: `Hello, I'd like to start a new session.${nameContext}`
    });

    // Prepare run configuration with dynamic settings
    const runConfig: any = {
      assistant_id: assistantId
    };

    // Use custom instructions if available
    if (settings?.instructions) {
      // Use additional_instructions to ensure it overrides properly
      runConfig.additional_instructions = settings.instructions + `\n\nIMPORTANT: For the initial greeting, start with:
"Good ${timeOfDay} — I'm glad you're here.

Let's begin with Phase 1: LET'S NAME IT.

What's the situation that's been sticking with you lately?

No need to overthink it — just whatever has been lingering or weighing on you in your co-parenting experience."`;
    } else {
      runConfig.additional_instructions = `OVERRIDE DEFAULT GREETING. You must start with this exact format:
      
"Good ${timeOfDay} — I'm glad you're here.

Let's begin with Phase 1: LET'S NAME IT.

What's the situation that's been sticking with you lately?

No need to overthink it — just whatever has been lingering or weighing on you in your co-parenting experience."`;
    }

    // Apply model parameters if available
    if (settings) {
      if (settings.model) runConfig.model = settings.model;
      if (settings.temperature !== undefined) runConfig.temperature = settings.temperature;
      if (settings.max_tokens) runConfig.max_completion_tokens = settings.max_tokens;
      if (settings.top_p !== undefined) runConfig.top_p = settings.top_p;
      
      // Add knowledge context if files are available
      if (settings.knowledge_files && settings.knowledge_files.length > 0) {
        const knowledgeContent = settings.knowledge_files
          .filter((f: any) => f.file_content)
          .map((f: any) => f.file_content)
          .join('\n\n---\n\n');
        
        if (knowledgeContent) {
          const knowledgeInstructions = `\n\nKnowledge Base Context:\n${knowledgeContent}\n\nUse the above knowledge base content to inform your responses when relevant.`;
          
          if (runConfig.additional_instructions) {
            runConfig.additional_instructions += knowledgeInstructions;
          } else if (runConfig.instructions) {
            runConfig.instructions += knowledgeInstructions;
          } else {
            runConfig.additional_instructions = knowledgeInstructions;
          }
          
          console.log(`Added knowledge base content to instructions (${knowledgeContent.length} chars)`);
        }
      }
    }

    console.log('>>> Sending to OpenAI with config:', JSON.stringify({
      assistant_id: runConfig.assistant_id,
      model: runConfig.model || 'not set',
      temperature: runConfig.temperature ?? 'not set',
      max_completion_tokens: runConfig.max_completion_tokens || 'not set',
      top_p: runConfig.top_p ?? 'not set',
      has_instructions: !!runConfig.instructions,
      has_additional_instructions: !!runConfig.additional_instructions,
      additional_instructions_length: runConfig.additional_instructions?.length || 0
    }, null, 2));
    
    const run = await openai.beta.threads.runs.create(threadId, runConfig);

    return this.waitForCompletion(threadId, run.id);
  }

  async sendMessage(threadId: string, message: string, conversationId?: string) {
    // Get active assistant settings
    const settings = await this.getActiveAssistantSettings();
    
    console.log('=== ASSISTANT SETTINGS BEING APPLIED (Send Message) ===');
    console.log('Active Setting Name:', settings?.name || 'Using defaults');
    console.log('Model:', settings?.model || 'default');
    console.log('Temperature:', settings?.temperature ?? 'default');
    console.log('Max Tokens:', settings?.max_tokens || 'default');
    console.log('Top P:', settings?.top_p ?? 'default');
    console.log('Knowledge Files:', settings?.knowledge_files?.length || 0);
    console.log('=========================================================');
    
    // Check for refinements to provide as context
    let additionalInstructions = '';
    if (conversationId) {
      const refinements = await this.getConversationRefinements(conversationId);
      console.log(`Found ${refinements.length} active refinements for conversation ${conversationId}`);
      if (refinements.length > 0) {
        additionalInstructions = this.buildRefinementContext(refinements);
        console.log('Refinements context being sent to OpenAI:', additionalInstructions);
      }
    }

    await openai.beta.threads.messages.create(threadId, {
      role: 'user',
      content: message
    });

    // Prepare run configuration with dynamic settings
    const runConfig: any = {
      assistant_id: assistantId
    };

    // Add refinements as additional instructions if available
    if (additionalInstructions) {
      runConfig.additional_instructions = additionalInstructions;
    }

    // Use custom instructions if available
    if (settings?.instructions) {
      // Always use additional_instructions to ensure proper override
      if (runConfig.additional_instructions) {
        runConfig.additional_instructions = `${settings.instructions}\n\n${runConfig.additional_instructions}`;
      } else {
        runConfig.additional_instructions = settings.instructions;
      }
    }

    // Apply model parameters if available
    if (settings) {
      if (settings.model) runConfig.model = settings.model;
      if (settings.temperature !== undefined) runConfig.temperature = settings.temperature;
      if (settings.max_tokens) runConfig.max_completion_tokens = settings.max_tokens;
      if (settings.top_p !== undefined) runConfig.top_p = settings.top_p;
      
      // Add knowledge context if files are available
      if (settings.knowledge_files && settings.knowledge_files.length > 0) {
        const knowledgeContent = settings.knowledge_files
          .filter((f: any) => f.file_content)
          .map((f: any) => f.file_content)
          .join('\n\n---\n\n');
        
        if (knowledgeContent) {
          const knowledgeInstructions = `\n\nKnowledge Base Context:\n${knowledgeContent}\n\nUse the above knowledge base content to inform your responses when relevant.`;
          
          if (runConfig.additional_instructions) {
            runConfig.additional_instructions += knowledgeInstructions;
          } else if (runConfig.instructions) {
            runConfig.instructions += knowledgeInstructions;
          } else {
            runConfig.additional_instructions = knowledgeInstructions;
          }
          
          console.log(`Added knowledge base content to instructions (${knowledgeContent.length} chars)`);
        }
      }
    }

    console.log('>>> Sending to OpenAI with config:', JSON.stringify({
      assistant_id: runConfig.assistant_id,
      model: runConfig.model || 'not set',
      temperature: runConfig.temperature ?? 'not set',
      max_completion_tokens: runConfig.max_completion_tokens || 'not set',
      top_p: runConfig.top_p ?? 'not set',
      has_instructions: !!runConfig.instructions,
      has_additional_instructions: !!runConfig.additional_instructions,
      additional_instructions_length: runConfig.additional_instructions?.length || 0
    }, null, 2));
    
    const run = await openai.beta.threads.runs.create(threadId, runConfig);

    return this.waitForCompletion(threadId, run.id);
  }

  private async getConversationRefinements(conversationId: string) {
    // Get refinements for messages in this conversation
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

    return `\n\nAdmin refinements for context (use as guidance, not exact responses):\n${guidance}`;
  }

  private async waitForCompletion(threadId: string, runId: string) {
    let run = await openai.beta.threads.runs.retrieve(runId, { thread_id: threadId });

    while (run.status === 'queued' || run.status === 'in_progress') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      run = await openai.beta.threads.runs.retrieve(runId, { thread_id: threadId });
    }

    if (run.status === 'completed') {
      const messages = await openai.beta.threads.messages.list(threadId);
      const lastMessage = messages.data[0];
      
      if (lastMessage.content[0].type === 'text') {
        return lastMessage.content[0].text.value;
      }
    }

    throw new Error(`Run failed with status: ${run.status}`);
  }

  async getThreadMessages(threadId: string) {
    const messages = await openai.beta.threads.messages.list(threadId);
    return messages.data.map(msg => ({
      role: msg.role,
      content: msg.content[0].type === 'text' ? msg.content[0].text.value : '',
      created_at: msg.created_at
    }));
  }

  async generateConversationTitle(userMessage: string, assistantResponse: string, conversationContext?: string): Promise<string> {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: conversationContext 
              ? 'Based on the full conversation context, generate a brief, descriptive title (max 4-5 words) that captures the evolved main topic. Focus on the core theme. Return only the title, no quotes or punctuation.'
              : 'Generate a brief, descriptive title (max 4-5 words) that captures the main issue or topic being discussed. Focus on the problem or challenge mentioned. Return only the title, no quotes or punctuation. Examples: "Co-parent Schedule Conflicts", "Work Life Balance", "Teen Communication Issues"'
          },
          {
            role: 'user',
            content: conversationContext
              ? `Conversation context:\n${conversationContext}\n\nLatest exchange:\nUser: ${userMessage.substring(0, 300)}\nAssistant: ${assistantResponse.substring(0, 300)}`
              : `User: ${userMessage.substring(0, 300)}\nAssistant: ${assistantResponse.substring(0, 300)}`
          }
        ],
        max_tokens: 20,
        temperature: 0.7
      });
      
      return completion.choices[0].message.content?.trim() || userMessage.substring(0, 50);
    } catch (error) {
      console.error('Failed to generate title:', error);
      return userMessage.substring(0, 50);
    }
  }

  async shouldRefineTitle(currentTitle: string, conversationContext: string): Promise<boolean> {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are evaluating whether a conversation title should be updated based on how the conversation has evolved. Respond with only "YES" or "NO".'
          },
          {
            role: 'user',
            content: `Current title: "${currentTitle}"\n\nRecent conversation:\n${conversationContext}\n\nHas the conversation evolved significantly enough that the title no longer accurately represents the main topic? Consider if:\n- The conversation has shifted to a different topic\n- The initial problem has been resolved and a new one introduced\n- The scope has significantly expanded or narrowed\n- A more specific issue has been identified\n\nRespond with YES or NO:`
          }
        ],
        max_tokens: 5,
        temperature: 0.3
      });
      
      const response = completion.choices[0].message.content?.trim().toUpperCase();
      return response === 'YES';
    } catch (error) {
      console.error('Failed to evaluate title refinement:', error);
      return false;
    }
  }

  async getChatCompletion(messages: Array<{role: string, content: string}>) {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: messages as any,
        max_tokens: 1000,
        temperature: 0.7
      });
      
      return completion.choices[0].message.content?.trim() || 'I apologize, but I was unable to generate a response. Please try again.';
    } catch (error) {
      console.error('Failed to get chat completion:', error);
      throw error;
    }
  }
}

export const openaiService = new OpenAIService();