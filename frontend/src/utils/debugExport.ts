import { supabase } from '../services/supabase';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  has_refinement?: boolean;
  refinement?: any;
  refinements?: any[];
}

interface DebugExport {
  exportDate: string;
  conversationId: string;
  conversationTitle: string;
  currentPhase: number;
  totalMessages: number;
  debugComments?: string;
  messages: Array<{
    id: string;
    role: string;
    content: string;
    timestamp: string;
    wordCount: number;
    characterCount: number;
    hasRefinement: boolean;
    refinements?: any[];
    phaseMarkers?: string[];
  }>;
  phaseTransitions: Array<{
    messageIndex: number;
    fromPhase: number;
    toPhase: number;
    trigger: string;
  }>;
  statistics: {
    userMessageCount: number;
    assistantMessageCount: number;
    averageUserMessageLength: number;
    averageAssistantMessageLength: number;
    totalDurationMinutes?: number;
    phaseDurations?: Record<number, number>;
  };
  adminTunerSettings?: any;
}

export const exportChatForDebug = async (
  conversationId: string,
  conversationTitle: string,
  messages: Message[],
  currentPhase: number,
  adminTunerSettings?: any,
  debugComments?: string
): Promise<void> => {
  // Extract phase markers from messages
  const phaseRegex = /\[Phase (\d+):\s*([^\]]+)\]/gi;
  
  // Process messages with additional metadata
  const processedMessages = messages.map((msg, index) => {
    const phaseMarkers: string[] = [];
    let match;
    while ((match = phaseRegex.exec(msg.content)) !== null) {
      phaseMarkers.push(`Phase ${match[1]}: ${match[2]}`);
    }
    
    return {
      id: msg.id,
      role: msg.role,
      content: msg.content,
      timestamp: msg.created_at,
      wordCount: msg.content.split(/\s+/).length,
      characterCount: msg.content.length,
      hasRefinement: msg.has_refinement || (msg.refinements && msg.refinements.length > 0) || false,
      refinements: msg.refinements || [],
      phaseMarkers: phaseMarkers.length > 0 ? phaseMarkers : undefined
    };
  });
  
  // Track phase transitions
  const phaseTransitions: DebugExport['phaseTransitions'] = [];
  let lastPhase = 1;
  processedMessages.forEach((msg, index) => {
    if (msg.phaseMarkers && msg.phaseMarkers.length > 0) {
      msg.phaseMarkers.forEach(marker => {
        const phaseMatch = marker.match(/Phase (\d+)/);
        if (phaseMatch) {
          const newPhase = parseInt(phaseMatch[1]);
          if (newPhase !== lastPhase) {
            phaseTransitions.push({
              messageIndex: index,
              fromPhase: lastPhase,
              toPhase: newPhase,
              trigger: msg.role === 'user' ? 'user_input' : 'assistant_response'
            });
            lastPhase = newPhase;
          }
        }
      });
    }
  });
  
  // Calculate statistics
  const userMessages = messages.filter(m => m.role === 'user');
  const assistantMessages = messages.filter(m => m.role === 'assistant');
  
  const avgUserLength = userMessages.length > 0 
    ? userMessages.reduce((sum, m) => sum + m.content.length, 0) / userMessages.length 
    : 0;
    
  const avgAssistantLength = assistantMessages.length > 0
    ? assistantMessages.reduce((sum, m) => sum + m.content.length, 0) / assistantMessages.length
    : 0;
  
  // Create the debug export object
  const debugData: DebugExport = {
    exportDate: new Date().toISOString(),
    conversationId,
    conversationTitle,
    currentPhase,
    totalMessages: messages.length,
    debugComments,
    messages: processedMessages,
    phaseTransitions,
    statistics: {
      userMessageCount: userMessages.length,
      assistantMessageCount: assistantMessages.length,
      averageUserMessageLength: Math.round(avgUserLength),
      averageAssistantMessageLength: Math.round(avgAssistantLength)
    },
    adminTunerSettings
  };
  
  // Convert to JSON with proper formatting
  const jsonString = JSON.stringify(debugData, null, 2);
  
  // Create filename with date and time
  const now = new Date();
  const dateStr = now.toISOString()
    .replace(/T/, '_')  // Replace T with underscore
    .replace(/:/g, '-') // Replace colons with dashes (for filesystem compatibility)
    .replace(/\..+/, ''); // Remove milliseconds
  const filename = `chat_debug_${dateStr}.json`;
  
  // Save to database
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user) {
      const { error } = await supabase
        .from('debug_exports')
        .insert({
          conversation_id: conversationId,
          user_id: userData.user.id,
          filename,
          comments: debugComments || null,
          export_data: debugData,
          current_phase: currentPhase,
          message_count: messages.length
        });
      
      if (error) {
        console.error('Failed to save debug export to database:', error);
      } else {
        console.log('Debug export saved to database');
      }
    }
  } catch (error) {
    console.error('Error saving debug export:', error);
  }
  
  // Create blob and download
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  console.log('Debug export completed:', {
    filename,
    conversationId,
    messageCount: messages.length,
    currentPhase,
    fileSize: `${Math.round(blob.size / 1024)}KB`,
    hasComments: !!debugComments
  });
};