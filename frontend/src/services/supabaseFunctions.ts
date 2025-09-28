import { supabase } from './supabase';

export const supabaseFunctions = {
  async sendTranscript(conversationId: string, email: string) {
    console.log('=== Sending Transcript ===');
    console.log('Conversation ID:', conversationId);
    console.log('Recipient Email:', email);
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    console.log('User ID:', user.id);
    console.log('Invoking Edge Function...');

    const response = await supabase.functions.invoke('send-transcript', {
      body: {
        conversationId,
        recipientEmail: email,
        userId: user.id
      }
    });

    console.log('Raw Edge Function response:', response);

    const { data, error } = response;

    if (error) {
      console.error('Edge Function error:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        details: error.details,
        context: error.context
      });
      
      // Try to get more info from the error
      if (error.context?.body) {
        try {
          // Try to read the response body if it's a ReadableStream
          const reader = error.context.body.getReader();
          const { value } = await reader.read();
          const errorText = new TextDecoder().decode(value);
          console.error('Error response text:', errorText);
          
          // Try to parse as JSON
          try {
            const errorJson = JSON.parse(errorText);
            console.error('Error response JSON:', errorJson);
            throw new Error(errorJson.error || errorJson.message || 'Failed to send transcript');
          } catch {
            throw new Error(errorText || 'Failed to send transcript');
          }
        } catch (readError) {
          console.error('Could not read error body:', readError);
        }
      }
      
      throw error;
    }

    // Check if the response indicates an error
    if (data && data.error) {
      console.error('Edge Function returned error:', data.error);
      throw new Error(data.error);
    }

    console.log('Edge Function response:', data);
    console.log('========================');
    
    return data;
  }
};