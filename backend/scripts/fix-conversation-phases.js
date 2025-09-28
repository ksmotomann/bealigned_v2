const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixConversationPhases() {
  console.log('Fixing conversation phases...\n');

  try {
    // First, fix all completed conversations - they should be Phase 7
    const { data: completedConvs, error: compError } = await supabase
      .from('conversations')
      .select('id, title, current_phase')
      .eq('is_completed', true)
      .neq('current_phase', 7);

    if (compError) {
      console.error('Error fetching completed conversations:', compError);
    } else if (completedConvs && completedConvs.length > 0) {
      console.log(`Found ${completedConvs.length} completed conversations with incorrect phase:\n`);
      
      for (const conv of completedConvs) {
        console.log(`  Fixing "${conv.title}" from Phase ${conv.current_phase} to Phase 7`);
        
        await supabase
          .from('conversations')
          .update({
            current_phase: 7,
            phase_updated_at: new Date().toISOString()
          })
          .eq('id', conv.id);
      }
      console.log('✓ All completed conversations updated to Phase 7\n');
    } else {
      console.log('✓ All completed conversations already have correct phase\n');
    }

    // Now check active conversations for proper phase detection
    const { data: activeConvs, error: activeError } = await supabase
      .from('conversations')
      .select('id, title, current_phase')
      .eq('is_completed', false)
      .is('archived_at', null);

    if (activeError) {
      console.error('Error fetching active conversations:', activeError);
      return;
    }

    console.log(`Analyzing ${activeConvs.length} active conversations:\n`);

    for (const conv of activeConvs) {
      const { data: messages, error: msgError } = await supabase
        .from('messages')
        .select('role, content')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: false })
        .limit(5); // Check last 5 messages

      if (msgError || !messages) continue;

      let detectedPhase = conv.current_phase || 1;
      let phaseChanged = false;

      // Check for phase indicators in recent messages
      for (const msg of messages) {
        if (msg.role === 'assistant') {
          const content = msg.content.toLowerCase();
          
          // Phase 7: Crafting/Draft indicators
          if (content.includes('craft') || content.includes('draft') || 
              content.includes('here\'s a message') || content.includes('here\'s what you could say')) {
            if (detectedPhase < 7) {
              detectedPhase = 7;
              phaseChanged = true;
              console.log(`  "${conv.title}": Detected Phase 7 (message crafting)`);
            }
          }
          // Phase 6: Options indicators
          else if (content.includes('options') || content.includes('possible approaches') || 
                   content.includes('different ways')) {
            if (detectedPhase < 6) {
              detectedPhase = 6;
              phaseChanged = true;
              console.log(`  "${conv.title}": Detected Phase 6 (exploring options)`);
            }
          }
          // Phase 5: Child's needs indicators
          else if ((content.includes('child\'s needs') || content.includes('your child') || 
                    content.includes('your son') || content.includes('griff\'s needs')) && 
                   detectedPhase < 5) {
            detectedPhase = 5;
            phaseChanged = true;
            console.log(`  "${conv.title}": Detected Phase 5 (child's needs)`);
          }
          // Phase 4: Co-parent indicators
          else if ((content.includes('co-parent') || content.includes('sue\'s') || 
                    content.includes('other parent')) && detectedPhase < 4) {
            detectedPhase = 4;
            phaseChanged = true;
            console.log(`  "${conv.title}": Detected Phase 4 (co-parent perspective)`);
          }
        }
      }

      if (phaseChanged) {
        await supabase
          .from('conversations')
          .update({
            current_phase: detectedPhase,
            phase_updated_at: new Date().toISOString()
          })
          .eq('id', conv.id);
        
        console.log(`    ✓ Updated to Phase ${detectedPhase}`);
      }
    }

    // Final summary
    const { data: finalStatus } = await supabase
      .from('conversations')
      .select('current_phase, is_completed')
      .is('archived_at', null);

    const phaseCounts = {};
    let completedCount = 0;
    
    finalStatus.forEach(conv => {
      if (conv.is_completed) completedCount++;
      phaseCounts[conv.current_phase] = (phaseCounts[conv.current_phase] || 0) + 1;
    });

    console.log('\n=== Final Status ===');
    console.log(`Total active conversations: ${finalStatus.length}`);
    console.log(`Completed conversations: ${completedCount}`);
    console.log('Phase distribution:');
    Object.keys(phaseCounts).sort().forEach(phase => {
      console.log(`  Phase ${phase}: ${phaseCounts[phase]} conversations`);
    });

  } catch (error) {
    console.error('Error during phase fixing:', error);
  }
}

// Run the fix
fixConversationPhases();