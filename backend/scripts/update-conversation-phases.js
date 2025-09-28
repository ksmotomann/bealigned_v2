const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function analyzeAndUpdatePhases() {
  console.log('Starting phase analysis for all conversations...\n');

  try {
    // Get all conversations that need phase analysis
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('id, title, current_phase')
      .is('archived_at', null)
      .order('created_at', { ascending: false });

    if (convError) {
      console.error('Error fetching conversations:', convError);
      return;
    }

    console.log(`Found ${conversations.length} active conversations to analyze\n`);

    for (const conversation of conversations) {
      console.log(`\nAnalyzing: "${conversation.title}" (ID: ${conversation.id})`);
      console.log(`Current phase in DB: ${conversation.current_phase || 1}`);

      // Get all messages for this conversation
      const { data: messages, error: msgError } = await supabase
        .from('messages')
        .select('id, role, content, created_at')
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: true });

      if (msgError) {
        console.error(`Error fetching messages for ${conversation.id}:`, msgError);
        continue;
      }

      // Analyze messages to determine actual phase
      let detectedPhase = 1;
      let lastPhaseTransition = null;
      const phaseRegex = /\[Phase (\d+):\s*([^\]]+)\]/i;
      const phaseSummaries = {};

      for (const message of messages) {
        if (message.role === 'assistant') {
          // Check for explicit phase indicators
          const match = message.content.match(phaseRegex);
          if (match) {
            const phase = parseInt(match[1]);
            const phaseName = match[2].trim();
            if (phase > detectedPhase) {
              detectedPhase = phase;
              lastPhaseTransition = message.id;
              phaseSummaries[`phase_${phase}`] = `Phase ${phase}: ${phaseName}`;
              console.log(`  Found Phase ${phase} indicator: "${phaseName}"`);
            }
          }

          // Also check for implicit phase transitions based on content
          const lowerContent = message.content.toLowerCase();
          
          // Phase 2: Beneath indicators
          if (detectedPhase === 1 && (
            lowerContent.includes('beneath the surface') ||
            lowerContent.includes('what emotions') ||
            lowerContent.includes('how are you feeling') ||
            lowerContent.includes('what feelings')
          )) {
            detectedPhase = 2;
            phaseSummaries['phase_2'] = 'Phase 2: Exploring underlying feelings';
            console.log('  Detected Phase 2 transition (feelings exploration)');
          }
          
          // Phase 3: Your Why indicators
          if (detectedPhase === 2 && (
            lowerContent.includes('why does this matter') ||
            lowerContent.includes('why is this important') ||
            lowerContent.includes('what makes this significant') ||
            lowerContent.includes('deeper meaning')
          )) {
            detectedPhase = 3;
            phaseSummaries['phase_3'] = 'Phase 3: Understanding why it matters';
            console.log('  Detected Phase 3 transition (exploring why)');
          }
          
          // Phase 4: Co-Parent's View indicators
          if (detectedPhase === 3 && (
            lowerContent.includes('co-parent') ||
            lowerContent.includes('sue\'s perspective') ||
            lowerContent.includes('how might they see') ||
            lowerContent.includes('their point of view') ||
            lowerContent.includes('other parent')
          )) {
            detectedPhase = 4;
            phaseSummaries['phase_4'] = 'Phase 4: Considering co-parent perspective';
            console.log('  Detected Phase 4 transition (co-parent perspective)');
          }
          
          // Phase 5: Child's Needs indicators
          if ((detectedPhase === 4 || detectedPhase === 3) && (
            lowerContent.includes('child\'s needs') ||
            lowerContent.includes('your child') ||
            lowerContent.includes('griff\'s needs') ||
            lowerContent.includes('what does your child need') ||
            lowerContent.includes('from your child\'s perspective') ||
            lowerContent.includes('best interest of')
          )) {
            detectedPhase = 5;
            phaseSummaries['phase_5'] = 'Phase 5: Focusing on child\'s needs';
            console.log('  Detected Phase 5 transition (child\'s needs)');
          }
          
          // Phase 6: Options indicators
          if (detectedPhase >= 4 && (
            lowerContent.includes('what are your options') ||
            lowerContent.includes('possible solutions') ||
            lowerContent.includes('different approaches') ||
            lowerContent.includes('let\'s explore options') ||
            lowerContent.includes('ways to address')
          )) {
            detectedPhase = 6;
            phaseSummaries['phase_6'] = 'Phase 6: Exploring solution options';
            console.log('  Detected Phase 6 transition (exploring options)');
          }
          
          // Phase 7: Choose indicators
          if (detectedPhase >= 5 && (
            lowerContent.includes('craft your message') ||
            lowerContent.includes('ready to write') ||
            lowerContent.includes('let\'s create your message') ||
            lowerContent.includes('compose the message') ||
            lowerContent.includes('put this into words')
          )) {
            detectedPhase = 7;
            phaseSummaries['phase_7'] = 'Phase 7: Crafting the message';
            console.log('  Detected Phase 7 transition (crafting message)');
          }
        }
      }

      console.log(`  Detected current phase: ${detectedPhase}`);
      console.log(`  Total messages analyzed: ${messages.length}`);

      // Update conversation if phase differs
      if (detectedPhase !== conversation.current_phase) {
        console.log(`  Updating phase from ${conversation.current_phase || 1} to ${detectedPhase}`);
        
        const { error: updateError } = await supabase
          .from('conversations')
          .update({
            current_phase: detectedPhase,
            phase_summaries: phaseSummaries,
            phase_updated_at: new Date().toISOString()
          })
          .eq('id', conversation.id);

        if (updateError) {
          console.error(`  Error updating conversation ${conversation.id}:`, updateError);
        } else {
          console.log(`  ✓ Successfully updated phase to ${detectedPhase}`);
        }

        // Update message phase numbers
        if (messages.length > 0) {
          // Assign phase numbers to messages based on detection
          let currentMessagePhase = 1;
          for (const message of messages) {
            // Check if this message triggers a phase transition
            if (message.role === 'assistant') {
              const match = message.content.match(phaseRegex);
              if (match) {
                currentMessagePhase = parseInt(match[1]);
              }
            }
            
            // Update the message with its phase number
            await supabase
              .from('messages')
              .update({
                phase_number: currentMessagePhase,
                is_phase_transition: message.id === lastPhaseTransition
              })
              .eq('id', message.id);
          }
        }
      } else {
        console.log(`  Phase is already correct (${detectedPhase})`);
      }
    }

    console.log('\n✅ Phase analysis complete!');
  } catch (error) {
    console.error('Error during phase analysis:', error);
  }
}

// Run the analysis
analyzeAndUpdatePhases();