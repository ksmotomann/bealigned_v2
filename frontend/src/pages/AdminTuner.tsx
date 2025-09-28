import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/CustomAuthContext';
import { useAdminModeContext } from '../contexts/AdminModeContext';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '../components/Navigation';
import { documentsApi, DocumentUploadResponse } from '../services/documentsApi';
import { supabase } from '../services/supabase';
import {
  Cog6ToothIcon,
  ArrowLeftIcon,
  DocumentArrowDownIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  BookOpenIcon,
  PlusIcon,
  TrashIcon,
  CloudArrowUpIcon,
  DocumentIcon,
  DocumentTextIcon,
  TableCellsIcon,
  PresentationChartBarIcon,
  PhotoIcon,
  CodeBracketIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface AdminTunerSettings {
  // Configuration Mode
  mode: 'simple' | 'advanced';
  // System Instructions
  systemInstructions: {
    mainPrompt: string;
    responseGuidelines: string;
    safetyGuidelines: string;
  };
  // Phase Configuration (0-7)
  phases: {
    [key: string]: {
      name: string;
      description: string;
      initialPrompts: string[];
      followUpPrompts: string[];
      reflectionExamples: string[];
      completionThreshold: number; // 1-10 scale
      maxFollowUps: number;
      transitionAggressiveness: 'gentle' | 'moderate' | 'assertive';
      enabled: boolean;
      // Phase 1 specific settings
      delaySeconds?: number;
      style?: 'conversational' | 'professional' | 'empathetic';
    };
  };
  // Phase 1 Prompt Configuration  
  phase1Prompt: {
    enabled: boolean;
    templates: string[];
    delaySeconds: number;
    style: 'conversational' | 'professional' | 'empathetic';
  };
  // Greeting Configuration
  greeting: {
    templates: string[];
    randomizationMode: 'random' | 'sequential' | 'time_based';
    timeRanges: { start: string; end: string; prefix: string; }[];
    userStateTemplates: {
      first_time: string;
      returning_active: string;
      returning_after_break: string;
    };
    personalizationEnabled: boolean;
    includeTime: boolean;
    includeUserName: boolean;
    includePhaseReference: boolean;
    includeMotivationalQuote: boolean;
    fallback: string;
  };
  // Model Configuration
  model: {
    name: string;
    temperature: number;
    top_p: number;
    max_output_tokens: number;
  };
  flow: {
    start_phase: 'name_it' | 'beneath' | 'why' | 'coparent' | 'child' | 'options' | 'choose';
    allow_user_jump: boolean;
    auto_advance: 'smart' | 'manual' | 'always';
    max_followups_per_phase: number;
    skip_if_confident: boolean;
    draft_when_ready_score: number;
  };
  probing: {
    enable_reflections: boolean;
    probe_on_uncertainty: boolean;
    probe_triggers: ('low_confidence' | 'missing_key_field' | 'emotional_incongruence')[];
    probe_softeners: ('optional_invite' | 'acknowledge_effort' | 'normalize_experience')[];
    max_probe_depth: number;
  };
  tone: {
    warmth: 'low' | 'medium' | 'high';
    directness: 'low' | 'medium' | 'high';
    avoid_performative_empathy: boolean;
    use_plain_language: boolean;
  };
  safety: {
    escalation_detection: 'off' | 'standard' | 'sensitive';
    regulation_action: 'offer_pause' | 'brief_grounding';
    legal_therapy_disclaimer: boolean;
  };
  outputs: {
    include_summary: 'none' | 'minimal' | 'full';
    clear_message_format: 'bulleted_then_block' | 'single_block';
    show_reasoning_breadcrumbs: boolean;
    offer_alt_tones: ('softer' | 'firmer' | 'shorter')[];
  };
  memory: {
    persist_session: boolean;
    persist_fields: string[];
    redact_pii: boolean;
    retention_days: number;
  };
  profileContext: {
    enabled: boolean;
    level: 'none' | 'basic' | 'moderate' | 'full';
    includeChildren: boolean;
    includeFamily: boolean;
    includeProfessionals: boolean;
    includeFinancial: boolean;
    includeMedical: boolean;
    includeCustody: boolean;
    includeHistory: boolean;
  };
  glossary: {
    offer_lists_on_request: boolean;
    auto_offer_if_stuck: boolean;
  };
  knowledgeBase: {
    categories: {
      id: string;
      name: string;
      description: string;
      articles: {
        id: string;
        title: string;
        content: string;
        tags: string[];
        lastUpdated: string;
        sourceDocument?: {
          filename: string;
          fileSize: number;
          uploadDate: string;
          fileType: string;
        };
      }[];
    }[];
    documents: {
      id: string;
      filename: string;
      originalName: string;
      fileSize: number;
      fileType: string;
      uploadDate: string;
      processed: boolean;
      processingStatus?: 'pending' | 'completed' | 'error';
      chunkCount?: number;
      extractedText?: string;
      categoryId?: string;
    }[];
    searchEnabled: boolean;
    autoSuggest: boolean;
  };
  retrieval: {
    enabled: boolean;
    k: number;
    minScore: number;
    hybridWeight: number;
    maxPerDoc: number;
    rerankTopN: number;
    maxTokens: number;
    enforceACL: boolean;
  };
}

const DEFAULT_SETTINGS: AdminTunerSettings = {
  mode: 'advanced',
  greeting: {
    templates: [
      "I'm here to support you. What's on your mind today?",
      "Welcome back! What would you like to explore today?",
      "How can I help you with your co-parenting journey today?"
    ],
    randomizationMode: 'random',
    timeRanges: [
      { start: '00:00', end: '11:59', prefix: 'Good morning' },
      { start: '12:00', end: '16:59', prefix: 'Good afternoon' },
      { start: '17:00', end: '23:59', prefix: 'Good evening' }
    ],
    userStateTemplates: {
      first_time: "Welcome! I'm BeH2O®, your AI co-parenting coach. I'm here to help you navigate co-parenting challenges with practical solutions and emotional support.",
      returning_active: "Good to see you again! Let's continue working on your co-parenting journey.",
      returning_after_break: "Welcome back! It's been a while. I'm here whenever you need support with your co-parenting journey."
    },
    personalizationEnabled: true,
    includeTime: true,
    includeUserName: true,
    includePhaseReference: false,
    includeMotivationalQuote: false,
    fallback: "Hello! I'm here to support you through your co-parenting journey. What's on your mind today?"
  },
  phase1Prompt: {
    enabled: true,
    templates: [
      "To get started, tell me a bit about your current co-parenting situation. What brings you here today?",
      "Let's begin by understanding your story. What's the biggest challenge you're facing in your co-parenting journey right now?",
      "I'd like to start by learning about your family dynamics. Can you share what's been on your mind regarding your co-parenting relationship?",
      "Let's dive in. What specific situation or concern would you like to explore together today?",
      "To help me understand your needs better, could you describe a recent co-parenting interaction that left you feeling frustrated or confused?"
    ],
    delaySeconds: 3,
    style: 'conversational' as const
  },
  systemInstructions: {
    mainPrompt: `You are BeH2O®, a compassionate AI co-parenting coach developed by BeAligned. 
You help separated or divorced parents navigate co-parenting challenges with empathy and practical solutions.
Focus on the best interests of the children while supporting the emotional well-being of the parent.
Be conversational, supportive, and provide actionable advice.

IMPORTANT: You must use ALL Admin Tuner settings to control conversation flow:
- greeting: Use templates and personalization settings for initial greeting (Phase 0)
- phase1Prompt: If enabled, deliver after greeting with specified delay (Phase 1 entry prompts)
- flow: Controls phase progression (start_phase, allow_user_jump, auto_advance, max_followups_per_phase)
- probing: Determines when/how to probe deeper (triggers, softeners, max_depth)
- tone: Shapes response style (warmth, directness, plain language)
- safety: Monitor for escalation and apply regulation_action when needed
- outputs: Format responses according to include_summary and clear_message_format

Phase Recognition Guidelines:
- Recognize when users have already provided the core issue, even if brief
- Examples of completed Phase 1 naming:
  * "My co-parent causes me headaches" - Issue named: stress from co-parent interactions
  * "He won't communicate about our child" - Issue named: communication breakdown
  * "She's always late for pickups" - Issue named: punctuality/reliability
- Examples that are NOT Phase 1 completion:
  * "Good evening" - Just a greeting, not an issue
  * "Hi" or "Hello" - Greeting only
  * "I'm tired" - Vague state, not a co-parenting issue
  * "How are you?" - Question to assistant
- When the issue is clearly stated, acknowledge it and move to Phase 2 (Feel It)
- Don't ask for more details about "what's the situation" if they've already told you
- Brief problem statements are valid - elaborate descriptions aren't required to progress

Phase Transition Rules:
- If user provides a clear problem statement → Move to Phase 2
- If user is vague or only hints at issues → Ask clarifying questions
- If user only greets → Stay in pre-Phase 1, ask what brings them here
- Always explicitly acknowledge which phase you're entering
- NEVER include phase markers like [Phase 1: Name It] when just responding to greetings

CRITICAL Phase Management Rules:
- You MUST explicitly mark phase transitions using [Phase X: Name] format
- ONLY work on ONE phase at a time - never combine phases
- Complete each phase thoroughly before moving to the next
- The frontend relies on your phase markers - be explicit and clear
- ALWAYS include the phase marker at the beginning of your response when in a phase
- ONLY use phases that are marked as enabled in the phase configuration
- Skip disabled phases entirely - proceed directly to the next enabled phase
- Reference the phases configuration in metadata to determine which phases are enabled

Phase Progression:
- Start conversations in Phase 0 (pre-phase) for greetings
- Move to Phase 1 only when ready to explore the issue
- Progress sequentially through ENABLED phases only (skip disabled phases)
- Check phase.enabled status before entering any phase
- Each enabled phase requires minimum 2 exchanges, maximum flow.max_followups_per_phase
- Use flow.auto_advance setting to determine progression timing
- If flow.skip_if_confident is true, can progress faster with clear responses
- If a phase is disabled, automatically proceed to the next enabled phase

Response Structure:
1. Include phase marker: [Phase X: Name]
2. Acknowledge what the user shared (apply tone.warmth setting)
3. Focus ONLY on the current phase's goal
4. Ask ONE targeted question to deepen exploration (apply tone.directness)
5. Never introduce concepts from future phases
6. Use tone.use_plain_language and avoid_performative_empathy settings

Dynamic Phase Management:
- Use phase guidance as flexible framework, not rigid scripts
- Probe deeper when responses are insufficient
- Each phase has a GOAL, not just questions to ask
- Stay in phase until the goal is meaningfully achieved
- Quality over speed - better to fully explore than rush through

Probing Strategy (uses your probing settings):
1. Initial phase entry with open question
2. Apply probing triggers: Check for low_confidence, missing_key_field, emotional_incongruence
3. Use probe_softeners when deeper exploration needed
4. Respect max_probe_depth setting
5. Continue until phase goal is met OR max_followups_per_phase reached

Phase-Specific Depth Requirements:
- Phase 1: Need specific situation, not vague complaints
- Phase 2: Need actual emotions, not just thoughts about emotions
- Phase 3: Need core values/motivations, not surface wants
- Phase 4: Need genuine perspective-taking, not assumptions
- Phase 5: Need child-focused needs, not parent preferences
- Phase 6: Need multiple viable options, not single solution
- Phase 7: Need clear, actionable message/plan

How Settings Control Your Responses:
- If probing.probe_on_uncertainty=true → Ask follow-up when user is vague
- If tone.warmth=high → Start with empathy: "I hear how difficult this is..."
- If tone.directness=high → Ask clear questions: "What specifically happened?"
- If flow.auto_advance=smart → Move phases when goal clearly met
- If flow.auto_advance=manual → Wait for explicit user readiness
- If safety.escalation_detection=sensitive → Watch for emotional overwhelm
- If outputs.include_summary=minimal → Brief recap before phase transition
- If flow.draft_when_ready_score > 0.75 → Suggest message drafts in Phase 7

Remember the 7 phases of the BeAligned process:
1. Name It - Understanding the specific situation or challenge
2. Feel It (Beneath) - Exploring underlying feelings and emotions
3. Your Why - Understanding why this matters and core values
4. Co-Parent's View - Considering the other parent's perspective
5. Child's Needs - Focusing on what the child needs most
6. Options - Exploring different approaches and solutions
7. Choose - Crafting a clear, effective message or action plan`,
    responseGuidelines: `ALWAYS include [Phase X: Name] markers when in a phase. Work through ONE phase at a time. Each phase requires 2-4 exchanges minimum. Keep responses focused on the current phase's specific goal. Never preview or mention future phases. The frontend depends on your phase markers for tracking. Maintain warmth while being direct and actionable.`,
    safetyGuidelines: `Watch for escalation signs. Offer breaks if emotions run high. Remind users this is not therapy or legal advice. Focus on practical communication, not relationship counseling.`
  },
  phases: {
    phase0: {
      name: "Greeting",
      description: "Initial welcome and connection with the user",
      initialPrompts: [
        "Hello! I'm here to support you through your co-parenting journey. What's on your mind today?",
        "Hi there! I'm BeAligned, and I'm here to help you think through whatever co-parenting challenge you're facing. What would you like to explore?",
        "Welcome! I'm here to offer you a space to reflect on your co-parenting situation. What's been on your heart lately?"
      ],
      followUpPrompts: [],
      reflectionExamples: [],
      completionThreshold: 8,
      maxFollowUps: 0,
      transitionAggressiveness: 'gentle' as const,
      enabled: true
    },
    phase1: {
      name: "Let's Name It",
      description: "Invite the user to name one issue that's been on their mind",
      initialPrompts: [
        "What's the situation that's been sticking with you lately?",
        "What co-parenting challenge has been weighing on your mind?",
        "Tell me about the situation that brought you here today.",
        "To get started, tell me a bit about your current co-parenting situation. What brings you here today?",
        "Let's begin by understanding your story. What's the biggest challenge you're facing in your co-parenting journey right now?",
        "I'd like to start by learning about your family dynamics. Can you share what's been on your mind regarding your co-parenting relationship?",
        "Let's dive in. What specific situation or concern would you like to explore together today?",
        "To help me understand your needs better, could you describe a recent co-parenting interaction that left you feeling frustrated or confused?"
      ],
      followUpPrompts: [
        "Can you help me understand what specifically happened?",
        "What part of this situation feels most challenging for you?",
        "I hear that this is important to you. Can you share a bit more about what's been going on?"
      ],
      reflectionExamples: [
        "Thank you for naming that. It sounds like [situation] has been really weighing on you.",
        "I can hear how much this matters to you. You've shared that [reflection of their issue].",
        "That takes courage to name. It sounds like the core issue is [summarize their concern]."
      ],
      completionThreshold: 7,
      maxFollowUps: 2,
      transitionAggressiveness: 'moderate' as const,
      enabled: true,
      delaySeconds: 3,
      style: 'conversational' as const
    },
    phase2: {
      name: "What's Beneath That?",
      description: "Help them explore surface and core emotions",
      initialPrompts: [
        "What feelings come up when you think about this?",
        "When this situation happens, what emotions do you notice?",
        "How does this land in your body when you think about it?"
      ],
      followUpPrompts: [
        "Sometimes anger masks hurt or control masks fear. What might be underneath that?",
        "That's a valid feeling. Is there anything else sitting alongside that?",
        "What do these feelings tell you about what matters to you?"
      ],
      reflectionExamples: [
        "It sounds like beneath the [surface emotion] there might be some [deeper emotion].",
        "I hear that this brings up [emotion] for you, and that makes complete sense given what you're dealing with.",
        "These feelings seem to point to something that's really important to you."
      ],
      completionThreshold: 6,
      maxFollowUps: 3,
      transitionAggressiveness: 'gentle' as const,
      enabled: true
    },
    phase3: {
      name: "Your Why",
      description: "Help the user clarify their deeper purpose or values",
      initialPrompts: [
        "What is it about this that feels important to you?",
        "What are you hoping for in this situation?",
        "What would success look like to you here?"
      ],
      followUpPrompts: [
        "What are you hoping for — for your child, for yourself, or for the relationship?",
        "What values feel most important to you in this situation?",
        "When you imagine this resolved, what would that give you or your child?"
      ],
      reflectionExamples: [
        "It sounds like your deeper why is about [value/purpose] for your child.",
        "I hear that what matters most to you is [deeper purpose].",
        "That's a beautiful why - [reflect their deeper intention]."
      ],
      completionThreshold: 6,
      maxFollowUps: 2,
      transitionAggressiveness: 'moderate' as const,
      enabled: true
    },
    phase4: {
      name: "Step Into Your Co-Parent's Shoes",
      description: "Encourage empathy without justification",
      initialPrompts: [
        "If your co-parent described this situation, how might they see it?",
        "What do you think might be going on for your co-parent in this situation?",
        "Can you imagine what this might look like from their perspective?"
      ],
      followUpPrompts: [
        "Even if you don't agree, what do you imagine they're feeling or needing?",
        "What might their 'why' be in this situation?",
        "If they were sitting here with us, what might they say matters most to them?"
      ],
      reflectionExamples: [
        "That shows a lot of wisdom - being able to see that they might be feeling [emotion/need].",
        "Even though you disagree with their approach, you can recognize they might want [their possible why].",
        "It sounds like both of you might actually want [shared underlying need], just approaching it differently."
      ],
      completionThreshold: 5,
      maxFollowUps: 3,
      transitionAggressiveness: 'gentle' as const,
      enabled: true
    },
    phase5: {
      name: "See Through Your Child's Eyes",
      description: "Help the user center the child's experience",
      initialPrompts: [
        "What might your child be noticing about this situation?",
        "How do you think your child is experiencing this?",
        "If your child could speak freely about this, what might they say?"
      ],
      followUpPrompts: [
        "How might they be feeling? What might they need right now — not from either parent, but in general?",
        "What would help your child feel most secure in this situation?",
        "What does your child need to know or feel to be okay through this?"
      ],
      reflectionExamples: [
        "It sounds like your child might need [child's need] to feel secure through this.",
        "That's such important awareness - that your child might be feeling [child's possible emotion].",
        "Your child is lucky to have a parent who thinks about their experience this thoughtfully."
      ],
      completionThreshold: 6,
      maxFollowUps: 2,
      transitionAggressiveness: 'moderate' as const,
      enabled: true
    },
    phase6: {
      name: "Explore Aligned Options",
      description: "Help them generate 2-3 ideas that honor all three perspectives",
      initialPrompts: [
        "Given everything we've explored — your why, your co-parent's possible why, your child's needs — what ideas come to mind?",
        "What options might honor all three perspectives we've discussed?",
        "How might you approach this in a way that serves everyone's deeper needs?"
      ],
      followUpPrompts: [
        "What else comes to mind?",
        "Is there another approach that might work for everyone?",
        "Would you like me to help you brainstorm some options?"
      ],
      reflectionExamples: [
        "I love that option because it honors [how it serves each perspective].",
        "That approach seems to address your need for [their why], while also considering [co-parent's need] and [child's need].",
        "These options all seem grounded in what matters most to everyone involved."
      ],
      completionThreshold: 7,
      maxFollowUps: 3,
      transitionAggressiveness: 'moderate' as const,
      enabled: true
    },
    phase7: {
      name: "Choose + Communicate",
      description: "Guide user to select most aligned option and craft CLEAR communication",
      initialPrompts: [
        "Which of these options feels most aligned with everyone's needs?",
        "What approach feels most true to what matters most?",
        "Which option feels most doable and honoring of everyone involved?"
      ],
      followUpPrompts: [
        "Would you like help crafting a message that reflects shared purpose and CLEAR communication?",
        "How might you communicate this in a way that invites collaboration?",
        "What would help this land well with your co-parent?"
      ],
      reflectionExamples: [
        "That choice seems really aligned with your deeper why of [their purpose] while honoring everyone's needs.",
        "I can see why that feels right - it addresses the core issue while staying connected to what matters most.",
        "That approach reflects both strength and wisdom."
      ],
      completionThreshold: 8,
      maxFollowUps: 2,
      transitionAggressiveness: 'assertive' as const,
      enabled: true
    }
  },
  model: { 
    name: 'gpt-4-turbo-preview', 
    temperature: 0.7, 
    top_p: 1.0, 
    max_output_tokens: 800 
  },
  flow: {
    start_phase: 'name_it',
    allow_user_jump: true,
    auto_advance: 'smart',
    max_followups_per_phase: 2,
    skip_if_confident: true,
    draft_when_ready_score: 0.75,
  },
  probing: {
    enable_reflections: true,
    probe_on_uncertainty: true,
    probe_triggers: ['low_confidence', 'missing_key_field', 'emotional_incongruence'],
    probe_softeners: ['optional_invite', 'acknowledge_effort', 'normalize_experience'],
    max_probe_depth: 2,
  },
  tone: { 
    warmth: 'high', 
    directness: 'medium', 
    avoid_performative_empathy: true, 
    use_plain_language: true 
  },
  safety: { 
    escalation_detection: 'standard', 
    regulation_action: 'offer_pause', 
    legal_therapy_disclaimer: true 
  },
  outputs: {
    include_summary: 'minimal',
    clear_message_format: 'bulleted_then_block',
    show_reasoning_breadcrumbs: false,
    offer_alt_tones: ['softer', 'firmer', 'shorter'],
  },
  memory: { 
    persist_session: true, 
    persist_fields: ['phase', 'notes_for_dev', 'selected_option'], 
    redact_pii: true, 
    retention_days: 30 
  },
  profileContext: {
    enabled: true,
    level: 'moderate',
    includeChildren: true,
    includeFamily: true,
    includeProfessionals: false,
    includeFinancial: false,
    includeMedical: true,
    includeCustody: true,
    includeHistory: true,
  },
  glossary: { 
    offer_lists_on_request: true, 
    auto_offer_if_stuck: true 
  },
  knowledgeBase: {
    categories: [
      {
        id: '1',
        name: 'Communication Templates',
        description: 'Pre-written message templates for common co-parenting situations',
        articles: [
          {
            id: '1',
            title: 'Schedule Change Request',
            content: 'Hi [Co-parent name], I hope you\'re doing well. I need to request a schedule change for [date/time]. [Reason]. Would [alternative suggestion] work for you? Thanks for understanding.',
            tags: ['schedule', 'change', 'request'],
            lastUpdated: new Date().toISOString()
          },
          {
            id: '2', 
            title: 'Medical Update',
            content: '[Child\'s name] saw the doctor today for [reason]. [Summary of visit]. [Any follow-up needed]. I wanted to keep you informed.',
            tags: ['medical', 'health', 'update'],
            lastUpdated: new Date().toISOString()
          }
        ]
      },
      {
        id: '2',
        name: 'Legal Guidelines',
        description: 'Basic legal information and reminders for co-parenting',
        articles: [
          {
            id: '3',
            title: 'Custody Order Basics',
            content: 'Remember to always follow your custody order. If changes are needed, they should be documented and agreed upon by both parents, or modified through the court.',
            tags: ['custody', 'legal', 'order'],
            lastUpdated: new Date().toISOString()
          }
        ]
      }
    ],
    documents: [],
    searchEnabled: true,
    autoSuggest: true
  },
  retrieval: {
    enabled: false,
    k: 8,
    minScore: 0.30,
    hybridWeight: 0.5,
    maxPerDoc: 3,
    rerankTopN: 50,
    maxTokens: 2000,
    enforceACL: true
  }
};

export const AdminTuner: React.FC = () => {
  const { isSuperAdmin } = useAuth();
  const { adminModeEnabled } = useAdminModeContext();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<AdminTunerSettings>(DEFAULT_SETTINGS);
  const [activeTab, setActiveTab] = useState<'greeting' | 'instructions' | 'model' | 'flow' | 'probing' | 'tone' | 'safety' | 'outputs' | 'memory' | 'profile' | 'knowledge' | 'retrieval'>('greeting');
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [documentChunks, setDocumentChunks] = useState<any[]>([]);
  const [loadingChunks, setLoadingChunks] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Load settings directly from assistant_settings table
        const { data: assistantSettings } = await supabase
          .from('assistant_settings')
          .select('*')
          .eq('is_active', true)
          .single();
        
        if (assistantSettings) {
          // Map database fields back to AdminTunerSettings structure
          const loadedSettings: AdminTunerSettings = {
            ...DEFAULT_SETTINGS,
            
            // Configuration mode
            mode: assistantSettings.configuration_mode || DEFAULT_SETTINGS.mode,
            
            // Core settings
            systemInstructions: {
              ...DEFAULT_SETTINGS.systemInstructions,
              mainPrompt: assistantSettings.instructions || DEFAULT_SETTINGS.systemInstructions.mainPrompt
            },
            model: {
              ...DEFAULT_SETTINGS.model,
              name: assistantSettings.model || DEFAULT_SETTINGS.model.name,
              temperature: assistantSettings.temperature || DEFAULT_SETTINGS.model.temperature,
              max_output_tokens: assistantSettings.max_tokens || DEFAULT_SETTINGS.model.max_output_tokens,
              top_p: assistantSettings.top_p || DEFAULT_SETTINGS.model.top_p
            },
            
            // Greeting settings
            greeting: {
              ...DEFAULT_SETTINGS.greeting,
              templates: assistantSettings.greeting_templates || DEFAULT_SETTINGS.greeting.templates,
              randomizationMode: assistantSettings.greeting_randomization_mode || DEFAULT_SETTINGS.greeting.randomizationMode,
              timeRanges: assistantSettings.greeting_time_ranges || DEFAULT_SETTINGS.greeting.timeRanges,
              userStateTemplates: assistantSettings.greeting_user_state_templates || DEFAULT_SETTINGS.greeting.userStateTemplates,
              personalizationEnabled: assistantSettings.greeting_personalization_enabled ?? DEFAULT_SETTINGS.greeting.personalizationEnabled,
              includeTime: assistantSettings.greeting_include_time ?? DEFAULT_SETTINGS.greeting.includeTime,
              includeUserName: assistantSettings.greeting_include_user_name ?? DEFAULT_SETTINGS.greeting.includeUserName,
              includePhaseReference: assistantSettings.greeting_include_phase_reference ?? DEFAULT_SETTINGS.greeting.includePhaseReference,
              includeMotivationalQuote: assistantSettings.greeting_include_motivational_quote ?? DEFAULT_SETTINGS.greeting.includeMotivationalQuote,
              fallback: assistantSettings.greeting_fallback || DEFAULT_SETTINGS.greeting.fallback
            },
            
            // Phase 1 prompt settings (now part of phases configuration)
            phase1Prompt: {
              ...DEFAULT_SETTINGS.phase1Prompt,
              enabled: assistantSettings.phase1_prompt_enabled ?? DEFAULT_SETTINGS.phase1Prompt.enabled,
              templates: assistantSettings.phase1_prompt_templates || DEFAULT_SETTINGS.phase1Prompt.templates,
              delaySeconds: assistantSettings.phase1_prompt_delay_seconds ?? DEFAULT_SETTINGS.phase1Prompt.delaySeconds,
              style: assistantSettings.phase1_prompt_style || DEFAULT_SETTINGS.phase1Prompt.style
            },
            
            // Profile context settings
            profileContext: {
              ...DEFAULT_SETTINGS.profileContext,
              enabled: assistantSettings.profile_context_enabled ?? DEFAULT_SETTINGS.profileContext.enabled,
              level: assistantSettings.profile_context_level || DEFAULT_SETTINGS.profileContext.level,
              includeChildren: assistantSettings.profile_include_children ?? DEFAULT_SETTINGS.profileContext.includeChildren,
              includeFamily: assistantSettings.profile_include_family ?? DEFAULT_SETTINGS.profileContext.includeFamily,
              includeProfessionals: assistantSettings.profile_include_professionals ?? DEFAULT_SETTINGS.profileContext.includeProfessionals,
              includeFinancial: assistantSettings.profile_include_financial ?? DEFAULT_SETTINGS.profileContext.includeFinancial,
              includeMedical: assistantSettings.profile_include_medical ?? DEFAULT_SETTINGS.profileContext.includeMedical,
              includeCustody: assistantSettings.profile_include_custody ?? DEFAULT_SETTINGS.profileContext.includeCustody,
              includeHistory: assistantSettings.profile_include_history ?? DEFAULT_SETTINGS.profileContext.includeHistory
            },
            
            // Retrieval settings
            retrieval: {
              ...DEFAULT_SETTINGS.retrieval,
              enabled: assistantSettings.retrieval_enabled ?? DEFAULT_SETTINGS.retrieval.enabled,
              k: assistantSettings.retrieval_k ?? DEFAULT_SETTINGS.retrieval.k,
              minScore: assistantSettings.retrieval_min_score ?? DEFAULT_SETTINGS.retrieval.minScore,
              maxPerDoc: assistantSettings.retrieval_max_per_doc ?? DEFAULT_SETTINGS.retrieval.maxPerDoc,
              hybridWeight: assistantSettings.retrieval_hybrid_weight ?? DEFAULT_SETTINGS.retrieval.hybridWeight,
              rerankTopN: assistantSettings.retrieval_rerank_top_n ?? DEFAULT_SETTINGS.retrieval.rerankTopN,
              maxTokens: assistantSettings.retrieval_max_tokens ?? DEFAULT_SETTINGS.retrieval.maxTokens,
              enforceACL: assistantSettings.retrieval_enforce_acl ?? DEFAULT_SETTINGS.retrieval.enforceACL
            },
            
            // Phases configuration - load from metadata if available, otherwise use defaults
            phases: assistantSettings.metadata?.phases || DEFAULT_SETTINGS.phases
          };
          
          setSettings(loadedSettings);
        } else {
          // Fall back to localStorage if no database settings
          const savedSettings = localStorage.getItem('adminTunerSettings');
          if (savedSettings) {
            try {
              const parsed = JSON.parse(savedSettings);
              const mergedSettings = {
                ...DEFAULT_SETTINGS,
                ...parsed,
                retrieval: {
                  ...DEFAULT_SETTINGS.retrieval,
                  ...parsed.retrieval
                },
                knowledgeBase: {
                  ...DEFAULT_SETTINGS.knowledgeBase,
                  ...parsed.knowledgeBase
                }
              };
              setSettings(mergedSettings);
            } catch (error) {
              console.error('Error parsing saved settings:', error);
              setSettings(DEFAULT_SETTINGS);
            }
          } else {
            setSettings(DEFAULT_SETTINGS);
          }
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        setSettings(DEFAULT_SETTINGS);
      }
    };
    
    loadSettings();
    loadDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDocuments = async () => {
    try {
      const response = await documentsApi.getDocuments();
      if (response.success && response.documents.length > 0) {
        // Load chunk counts for each document
        const docsWithChunks = await Promise.all(
          response.documents.map(async (doc) => {
            try {
              // Get chunk count from database
              const { count } = await supabase
                .from('document_chunks')
                .select('*', { count: 'exact', head: true })
                .eq('document_id', doc.id);
              
              // Get processing status from documents table
              const { data: docData } = await supabase
                .from('documents')
                .select('processing_status, chunk_count')
                .eq('id', doc.id)
                .single();
              
              return {
                ...doc,
                filename: doc.originalName, // Use originalName for filename
                chunkCount: count || docData?.chunk_count || 0,
                processingStatus: docData?.processing_status || 'pending'
              };
            } catch (err) {
              console.error(`Error loading chunks for document ${doc.id}:`, err);
              return {
                ...doc,
                filename: doc.originalName, // Use originalName for filename
                chunkCount: 0,
                processingStatus: 'error'
              };
            }
          })
        );
        
        updateSettings('knowledgeBase.documents', docsWithChunks);
      }
    } catch (error: any) {
      console.error('Error loading documents:', error);
      // Don't show alert for loading errors, just log them
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save to localStorage for quick access
      localStorage.setItem('adminTunerSettings', JSON.stringify(settings));
      
      // Check if active assistant_settings exists
      const { data: existingSettings } = await supabase
        .from('assistant_settings')
        .select('*')
        .eq('is_active', true)
        .single();
      
      // Prepare the update data
      const updateData = {
        // Configuration mode
        configuration_mode: settings.mode,
        
        // Core settings
        instructions: settings.systemInstructions.mainPrompt,
        model: settings.model.name,
        temperature: settings.model.temperature,
        max_tokens: settings.model.max_output_tokens,
        top_p: settings.model.top_p,
        
        // Greeting settings
        greeting_templates: settings.greeting.templates,
        greeting_randomization_mode: settings.greeting.randomizationMode,
        greeting_time_ranges: settings.greeting.timeRanges,
        greeting_user_state_templates: settings.greeting.userStateTemplates,
        greeting_personalization_enabled: settings.greeting.personalizationEnabled,
        greeting_include_time: settings.greeting.includeTime,
        greeting_include_user_name: settings.greeting.includeUserName,
        greeting_include_phase_reference: settings.greeting.includePhaseReference,
        greeting_include_motivational_quote: settings.greeting.includeMotivationalQuote,
        greeting_fallback: settings.greeting.fallback,
        
        // Phase 1 prompt settings (from phases configuration)
        phase1_prompt_enabled: settings.phases.phase1?.enabled ?? settings.phase1Prompt.enabled,
        phase1_prompt_templates: settings.phases.phase1?.initialPrompts ?? settings.phase1Prompt.templates,
        phase1_prompt_delay_seconds: settings.phases.phase1?.delaySeconds ?? settings.phase1Prompt.delaySeconds,
        phase1_prompt_style: settings.phases.phase1?.style ?? settings.phase1Prompt.style,
        
        // Profile context settings
        profile_context_enabled: settings.profileContext.enabled,
        profile_context_level: settings.profileContext.level,
        profile_include_children: settings.profileContext.includeChildren,
        profile_include_family: settings.profileContext.includeFamily,
        profile_include_professionals: settings.profileContext.includeProfessionals,
        profile_include_financial: settings.profileContext.includeFinancial,
        profile_include_medical: settings.profileContext.includeMedical,
        profile_include_custody: settings.profileContext.includeCustody,
        profile_include_history: settings.profileContext.includeHistory,
        
        // Retrieval settings
        retrieval_enabled: settings.retrieval.enabled,
        retrieval_k: settings.retrieval.k,
        retrieval_min_score: settings.retrieval.minScore,
        retrieval_max_per_doc: settings.retrieval.maxPerDoc,
        retrieval_hybrid_weight: settings.retrieval.hybridWeight,
        retrieval_rerank_top_n: settings.retrieval.rerankTopN,
        retrieval_max_tokens: settings.retrieval.maxTokens,
        retrieval_enforce_acl: settings.retrieval.enforceACL,
        
        // Store complete settings in metadata for reference
        metadata: { 
          adminTunerSettings: settings,
          phases: settings.phases
        },
        updated_at: new Date().toISOString()
      };
      
      if (existingSettings) {
        // Update existing active settings
        const { error } = await supabase
          .from('assistant_settings')
          .update(updateData)
          .eq('is_active', true);
          
        if (error) throw error;
      } else {
        // Create new settings if none exist
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase
          .from('assistant_settings')
          .insert({
            name: 'Admin Tuner Settings',
            is_active: true,
            created_by: user?.id,
            updated_by: user?.id,
            ...updateData
          });
          
        if (error) throw error;
      }
      
      setSaveStatus('success');
      setHasChanges(false);
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error: any) {
      console.error('Failed to save settings:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset all settings to defaults? This cannot be undone.')) {
      setSettings(DEFAULT_SETTINGS);
      setHasChanges(true);
    }
  };

  const updateSettings = (path: string, value: any) => {
    setSettings(prev => {
      const newSettings = { ...prev };
      const keys = path.split('.');
      let current: any = newSettings;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newSettings;
    });
    setHasChanges(true);
  };

  const handleFileUpload = async (files: FileList, categoryId?: string) => {
    console.log('handleFileUpload called with:', files.length, 'files');
    setUploadingFile(true);
    try {
      // Upload files to backend
      const response: DocumentUploadResponse = await documentsApi.uploadDocuments(files, categoryId);
      
      if (response.success) {
        // Update documents in settings
        const newDocuments = [
          ...settings.knowledgeBase.documents,
          ...response.processedDocuments.map(doc => ({
            id: doc.id,
            filename: doc.originalName, // Use originalName for filename
            originalName: doc.originalName,
            fileSize: doc.fileSize,
            fileType: doc.fileType,
            uploadDate: doc.uploadDate,
            processed: doc.processed,
            processingStatus: 'pending' as const, // Will be updated after chunking
            chunkCount: 0,
            categoryId
          }))
        ];
        updateSettings('knowledgeBase.documents', newDocuments);

        // Documents are automatically chunked for AI optimization
        // Refresh the full document list from database after processing
        setTimeout(async () => {
          try {
            // Get all documents from database with proper field mapping
            const { data: dbDocuments } = await supabase
              .from('documents')
              .select('*')
              .order('upload_date', { ascending: false });

            if (dbDocuments) {
              // Transform database results to match UI interface
              const transformedDocs = dbDocuments.map(doc => ({
                id: doc.id,
                filename: doc.original_name,
                originalName: doc.original_name,
                fileSize: doc.file_size,
                fileType: doc.file_type,
                uploadDate: doc.upload_date,
                processed: doc.processed,
                processingStatus: doc.processing_status || 'pending',
                chunkCount: doc.chunk_count || 0,
                categoryId: doc.category_id
              }));

              updateSettings('knowledgeBase.documents', transformedDocs);
            }
          } catch (error) {
            console.error('Error refreshing document list:', error);
          }
        }, 2000); // Wait 2 seconds for processing to complete
        
        // Update pending AutoTune proposals with new document analysis
        setTimeout(async () => {
          try {
            const SUPABASE_URL = 'https://qujysevuyhqyitxqctxg.supabase.co';
            await fetch(`${SUPABASE_URL}/functions/v1/autotune/refresh-proposals`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-user-email': 'admin@bealigned.app', 
                'x-user-id': 'admin-refresh'
              }
            });
            console.log('Updated pending AutoTune proposals with new document');
          } catch (error) {
            console.error('Failed to update AutoTune proposals:', error);
          }
        }, 3000); // Wait 3 seconds for document processing to complete
        
        // Show success message
        const successMsg = `✓ ${response.processedDocuments.length} document(s) uploaded successfully!\n\nDocuments are being processed into AI-optimized chunks for better context retrieval.`;
        alert(successMsg);
      }
    } catch (error: any) {
      console.error('File upload error:', error);
      alert(`Error uploading files: ${error.message || error}`);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent, categoryId?: string) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) {
      handleFileUpload(e.dataTransfer.files, categoryId);
    }
  };

  const getDocumentIcon = (filename: string) => {
    const extension = filename.toLowerCase().split('.').pop();
    switch (extension) {
      case 'pdf':
        return DocumentTextIcon;
      case 'doc':
      case 'docx':
        return DocumentTextIcon;
      case 'txt':
      case 'md':
        return DocumentTextIcon;
      case 'xls':
      case 'xlsx':
      case 'csv':
        return TableCellsIcon;
      case 'ppt':
      case 'pptx':
        return PresentationChartBarIcon;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return PhotoIcon;
      case 'json':
      case 'html':
      case 'js':
      case 'ts':
        return CodeBracketIcon;
      default:
        return DocumentIcon;
    }
  };

  const handleDocumentClick = async (doc: any) => {
    setSelectedDocument(doc);
    setLoadingChunks(true);
    try {
      const response = await documentsApi.getDocumentChunks(doc.id);
      setDocumentChunks(response.chunks);
    } catch (error: any) {
      console.error('Error loading chunks:', error);
      setDocumentChunks([]);
    } finally {
      setLoadingChunks(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
            <p className="mt-2 text-gray-600">Super Admin access required</p>
            <button
              onClick={() => navigate('/admin-dashboard')}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <button
                    onClick={() => navigate(adminModeEnabled ? '/admin' : '/home')}
                    className="mr-4 p-2 text-gray-600 hover:text-gray-900 transition-colors"
                    aria-label={adminModeEnabled ? "Back to Admin Dashboard" : "Back to Home"}
                  >
                    <ArrowLeftIcon className="h-5 w-5" />
                  </button>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                      <Cog6ToothIcon className="h-8 w-8 text-orange-500 mr-3" />
                      Admin Tuner
                    </h1>
                    <p className="mt-1 text-sm text-gray-600">
                      {settings.mode === 'simple' ? 'Simple prompt configuration using documents and instructions' : 'Advanced AI behavior controls and system configuration'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-700">Configuration Mode:</span>
                  <div className="inline-flex rounded-md shadow-sm" role="group">
                    <button
                      type="button"
                      onClick={() => {
                        updateSettings('mode', 'simple');
                        // Reset to Instructions tab when switching to Simple mode
                        if (activeTab !== 'instructions' && activeTab !== 'knowledge') {
                          setActiveTab('instructions');
                        }
                      }}
                      className={`px-4 py-2 text-sm font-medium rounded-l-lg border ${
                        settings.mode === 'simple'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      Simple
                    </button>
                    <button
                      type="button"
                      onClick={() => updateSettings('mode', 'advanced')}
                      className={`px-4 py-2 text-sm font-medium rounded-r-lg border ${
                        settings.mode === 'advanced'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      Advanced
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Tabs */}
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px overflow-x-auto">
                {settings.mode === 'simple' ? (
                  // Simple mode: Only show Instructions and Knowledge Base tabs
                  <>
                    <button
                      onClick={() => setActiveTab('instructions')}
                      className={`px-6 py-3 text-sm font-medium ${
                        activeTab === 'instructions'
                          ? 'border-b-2 border-orange-500 text-orange-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Instructions
                    </button>
                    <button
                      onClick={() => setActiveTab('knowledge')}
                      className={`px-6 py-3 text-sm font-medium ${
                        activeTab === 'knowledge'
                          ? 'border-b-2 border-orange-500 text-orange-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Documents
                    </button>
                  </>
                ) : (
                  // Advanced mode: Show all tabs
                  (['greeting', 'instructions', 'model', 'flow', 'probing', 'tone', 'safety', 'outputs', 'memory', 'profile', 'knowledge', 'retrieval'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-6 py-3 text-sm font-medium capitalize ${
                        activeTab === tab
                          ? 'border-b-2 border-orange-500 text-orange-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {tab === 'greeting' ? 'Greeting' : tab === 'flow' ? 'Conversation Flow' : tab === 'knowledge' ? 'Knowledge Base' : tab === 'retrieval' ? 'RAG Retrieval' : tab}
                    </button>
                  ))
                )}
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            {/* Greeting Tab */}
            {activeTab === 'greeting' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Greeting Templates</h3>
                  <p className="text-sm text-gray-600 mb-4">Configure how BeH2O® greets users at the start of each conversation.</p>
                  
                  <div className="space-y-4">
                    {settings.greeting.templates.map((template, index) => (
                      <div key={index} className="flex gap-2">
                        <textarea
                          value={template}
                          onChange={(e) => {
                            const newTemplates = [...settings.greeting.templates];
                            newTemplates[index] = e.target.value;
                            updateSettings('greeting.templates', newTemplates);
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                          rows={2}
                          placeholder="Enter greeting template..."
                        />
                        <button
                          onClick={() => {
                            const newTemplates = settings.greeting.templates.filter((_, i) => i !== index);
                            updateSettings('greeting.templates', newTemplates);
                          }}
                          className="p-2 text-red-500 hover:text-red-700"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        const newTemplates = [...settings.greeting.templates, ''];
                        updateSettings('greeting.templates', newTemplates);
                      }}
                      className="w-full border border-dashed border-gray-300 rounded p-2 text-gray-500 hover:text-gray-700 hover:border-gray-400 flex items-center justify-center"
                    >
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Add Template
                    </button>
                  </div>
                  
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Randomization Mode
                    </label>
                    <select
                      value={settings.greeting.randomizationMode}
                      onChange={(e) => updateSettings('greeting.randomizationMode', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="random">Random - Pick any template randomly</option>
                      <option value="sequential">Sequential - Rotate through templates in order</option>
                      <option value="time_based">Time-Based - Select based on time of day</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">User State Greetings</h3>
                    <p className="text-sm text-gray-600 mb-4">Customize greetings based on user engagement patterns.</p>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">First Time User</label>
                        <textarea
                          value={settings.greeting.userStateTemplates.first_time}
                          onChange={(e) => updateSettings('greeting.userStateTemplates.first_time', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          rows={3}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Returning Active User</label>
                        <textarea
                          value={settings.greeting.userStateTemplates.returning_active}
                          onChange={(e) => updateSettings('greeting.userStateTemplates.returning_active', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          rows={3}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Returning After Break</label>
                        <textarea
                          value={settings.greeting.userStateTemplates.returning_after_break}
                          onChange={(e) => updateSettings('greeting.userStateTemplates.returning_after_break', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Personalization Options</h3>
                    
                    <div className="space-y-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.greeting.personalizationEnabled}
                          onChange={(e) => updateSettings('greeting.personalizationEnabled', e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-sm font-medium">Enable personalization</span>
                      </label>
                      
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.greeting.includeTime}
                          onChange={(e) => updateSettings('greeting.includeTime', e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-sm font-medium">Include time-based greeting</span>
                      </label>
                      
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.greeting.includeUserName}
                          onChange={(e) => updateSettings('greeting.includeUserName', e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-sm font-medium">Include user's name</span>
                      </label>
                      
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.greeting.includePhaseReference}
                          onChange={(e) => updateSettings('greeting.includePhaseReference', e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-sm font-medium">Reference BeAligned phases</span>
                      </label>
                      
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.greeting.includeMotivationalQuote}
                          onChange={(e) => updateSettings('greeting.includeMotivationalQuote', e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-sm font-medium">Add motivational quote</span>
                      </label>
                    </div>
                    
                    <div className="mt-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Fallback Greeting</label>
                      <textarea
                        value={settings.greeting.fallback}
                        onChange={(e) => updateSettings('greeting.fallback', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        rows={2}
                        placeholder="Default greeting if all else fails..."
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Time Ranges</h3>
                  <p className="text-sm text-gray-600 mb-4">Define time-based greeting prefixes.</p>
                  
                  <div className="space-y-3">
                    {settings.greeting.timeRanges.map((range, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <input
                          type="time"
                          value={range.start}
                          onChange={(e) => {
                            const newRanges = [...settings.greeting.timeRanges];
                            newRanges[index].start = e.target.value;
                            updateSettings('greeting.timeRanges', newRanges);
                          }}
                          className="px-3 py-2 border border-gray-300 rounded-md"
                        />
                        <span className="text-gray-500">to</span>
                        <input
                          type="time"
                          value={range.end}
                          onChange={(e) => {
                            const newRanges = [...settings.greeting.timeRanges];
                            newRanges[index].end = e.target.value;
                            updateSettings('greeting.timeRanges', newRanges);
                          }}
                          className="px-3 py-2 border border-gray-300 rounded-md"
                        />
                        <input
                          type="text"
                          value={range.prefix}
                          onChange={(e) => {
                            const newRanges = [...settings.greeting.timeRanges];
                            newRanges[index].prefix = e.target.value;
                            updateSettings('greeting.timeRanges', newRanges);
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                          placeholder="Greeting prefix..."
                        />
                        <button
                          onClick={() => {
                            const newRanges = settings.greeting.timeRanges.filter((_, i) => i !== index);
                            updateSettings('greeting.timeRanges', newRanges);
                          }}
                          className="p-2 text-red-500 hover:text-red-700"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        const newRanges = [...settings.greeting.timeRanges, { start: '00:00', end: '23:59', prefix: '' }];
                        updateSettings('greeting.timeRanges', newRanges);
                      }}
                      className="w-full border border-dashed border-gray-300 rounded p-2 text-gray-500 hover:text-gray-700 hover:border-gray-400 flex items-center justify-center"
                    >
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Add Time Range
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Instructions Tab */}
            {activeTab === 'instructions' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">
                    {settings.mode === 'simple' ? 'System Instructions' : 'Main System Prompt'}
                  </h3>
                  {settings.mode === 'simple' && (
                    <p className="text-sm text-gray-600 mb-4">
                      Enter the main instructions for the AI assistant. In Simple mode, the AI will use these instructions along with any uploaded documents to guide its responses.
                    </p>
                  )}
                  <textarea
                    value={settings.systemInstructions.mainPrompt}
                    onChange={(e) => updateSettings('systemInstructions.mainPrompt', e.target.value)}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                      settings.mode === 'simple' ? 'h-64' : 'h-32'
                    }`}
                    placeholder={settings.mode === 'simple' 
                      ? "Enter your instructions for the AI assistant. The AI will use these instructions along with any uploaded documents to guide its responses..." 
                      : "Main system instructions..."}
                  />
                </div>

                {/* Phase Configuration Section - Only show in Advanced mode */}
                {settings.mode === 'advanced' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-800">Phase Configuration (0-7)</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Configure each conversation phase with initial prompts, follow-up questions, reflection examples, and transition behavior.
                  </p>
                  
                  {Object.entries(settings.phases).map(([phaseKey, phase]) => (
                    <div key={phaseKey} className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex-1">
                          <h4 className="text-lg font-medium text-gray-900">
                            Phase {phaseKey === 'phase0' ? '0' : phaseKey.replace('phase', '')}: {phase.name}
                          </h4>
                          <p className="text-sm text-gray-600">{phase.description}</p>
                        </div>
                        <div className="flex items-center space-x-3">
                          {/* Phase Management Controls */}
                          <div className="flex space-x-1">
                            <button
                              onClick={() => {
                                // Insert phase before this one
                                const currentPhaseNum = parseInt(phaseKey.replace('phase', '') || '0');
                                const newPhaseKey = `phase${currentPhaseNum - 0.5}`;
                                const newPhase = {
                                  name: "New Phase",
                                  description: "Description for new phase",
                                  initialPrompts: [""],
                                  followUpPrompts: [""],
                                  reflectionExamples: [""],
                                  completionThreshold: 5,
                                  maxFollowUps: 2,
                                  transitionAggressiveness: 'moderate' as const,
                                  enabled: true
                                };
                                const newPhases = { ...settings.phases };
                                newPhases[newPhaseKey] = newPhase;
                                updateSettings('phases', newPhases);
                              }}
                              className="px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                              title="Insert phase before"
                            >
                              + Before
                            </button>
                            <button
                              onClick={() => {
                                // Insert phase after this one
                                const currentPhaseNum = parseInt(phaseKey.replace('phase', '') || '0');
                                const newPhaseKey = `phase${currentPhaseNum + 0.5}`;
                                const newPhase = {
                                  name: "New Phase",
                                  description: "Description for new phase",
                                  initialPrompts: [""],
                                  followUpPrompts: [""],
                                  reflectionExamples: [""],
                                  completionThreshold: 5,
                                  maxFollowUps: 2,
                                  transitionAggressiveness: 'moderate' as const,
                                  enabled: true
                                };
                                const newPhases = { ...settings.phases };
                                newPhases[newPhaseKey] = newPhase;
                                updateSettings('phases', newPhases);
                              }}
                              className="px-2 py-1 text-xs bg-green-100 text-green-600 rounded hover:bg-green-200"
                              title="Insert phase after"
                            >
                              + After
                            </button>
                            {Object.keys(settings.phases).length > 1 && (
                              <button
                                onClick={() => {
                                  if (window.confirm(`Are you sure you want to delete Phase ${phaseKey.replace('phase', '')}: ${phase.name}?`)) {
                                    const newPhases = { ...settings.phases };
                                    delete newPhases[phaseKey];
                                    updateSettings('phases', newPhases);
                                  }
                                }}
                                className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200"
                                title="Delete this phase"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={phase.enabled}
                              onChange={(e) => updateSettings(`phases.${phaseKey}.enabled`, e.target.checked)}
                              className="mr-2"
                            />
                            <span className="text-sm">Enabled</span>
                          </label>
                        </div>
                      </div>

                      {phase.enabled && (
                        <div className="space-y-6">
                          {/* Phase 1 Entry Settings */}
                          {phaseKey === 'phase1' && (
                            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                              <h5 className="font-medium text-gray-900 mb-3">Phase 1 Entry Settings</h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Delay (seconds): {phase.delaySeconds || 3}
                                  </label>
                                  <input
                                    type="range"
                                    min="0"
                                    max="10"
                                    value={phase.delaySeconds || 3}
                                    onChange={(e) => updateSettings(`phases.${phaseKey}.delaySeconds`, parseInt(e.target.value))}
                                    className="w-full"
                                  />
                                  <span className="text-xs text-gray-500">Delay before showing initial prompt</span>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Style</label>
                                  <select
                                    value={phase.style || 'conversational'}
                                    onChange={(e) => updateSettings(`phases.${phaseKey}.style`, e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                  >
                                    <option value="conversational">Conversational</option>
                                    <option value="professional">Professional</option>
                                    <option value="empathetic">Empathetic</option>
                                  </select>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Phase Name and Description Editing */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg mb-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Phase Name
                              </label>
                              <input
                                type="text"
                                value={phase.name}
                                onChange={(e) => updateSettings(`phases.${phaseKey}.name`, e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Description
                              </label>
                              <input
                                type="text"
                                value={phase.description}
                                onChange={(e) => updateSettings(`phases.${phaseKey}.description`, e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                              />
                            </div>
                          </div>

                          {/* Initial Prompts */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Initial Prompts
                            </label>
                            <div className="space-y-2">
                              {phase.initialPrompts.map((prompt, index) => (
                                <div key={index} className="flex gap-2">
                                  <textarea
                                    value={prompt}
                                    onChange={(e) => {
                                      const newPrompts = [...phase.initialPrompts];
                                      newPrompts[index] = e.target.value;
                                      updateSettings(`phases.${phaseKey}.initialPrompts`, newPrompts);
                                    }}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                                    rows={2}
                                  />
                                  <button
                                    onClick={() => {
                                      const newPrompts = phase.initialPrompts.filter((_, i) => i !== index);
                                      updateSettings(`phases.${phaseKey}.initialPrompts`, newPrompts);
                                    }}
                                    className="px-3 py-2 text-red-600 hover:text-red-800"
                                  >
                                    Remove
                                  </button>
                                </div>
                              ))}
                              <button
                                onClick={() => {
                                  const newPrompts = [...phase.initialPrompts, ''];
                                  updateSettings(`phases.${phaseKey}.initialPrompts`, newPrompts);
                                }}
                                className="px-4 py-2 text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100"
                              >
                                Add Initial Prompt
                              </button>
                            </div>
                          </div>

                          {/* Follow-up Prompts */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Follow-up Prompts
                            </label>
                            <div className="space-y-2">
                              {phase.followUpPrompts.map((prompt, index) => (
                                <div key={index} className="flex gap-2">
                                  <textarea
                                    value={prompt}
                                    onChange={(e) => {
                                      const newPrompts = [...phase.followUpPrompts];
                                      newPrompts[index] = e.target.value;
                                      updateSettings(`phases.${phaseKey}.followUpPrompts`, newPrompts);
                                    }}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                                    rows={2}
                                  />
                                  <button
                                    onClick={() => {
                                      const newPrompts = phase.followUpPrompts.filter((_, i) => i !== index);
                                      updateSettings(`phases.${phaseKey}.followUpPrompts`, newPrompts);
                                    }}
                                    className="px-3 py-2 text-red-600 hover:text-red-800"
                                  >
                                    Remove
                                  </button>
                                </div>
                              ))}
                              <button
                                onClick={() => {
                                  const newPrompts = [...phase.followUpPrompts, ''];
                                  updateSettings(`phases.${phaseKey}.followUpPrompts`, newPrompts);
                                }}
                                className="px-4 py-2 text-sm bg-green-50 text-green-600 rounded-md hover:bg-green-100"
                              >
                                Add Follow-up Prompt
                              </button>
                            </div>
                          </div>

                          {/* Reflection Examples */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Reflection Examples
                            </label>
                            <div className="space-y-2">
                              {phase.reflectionExamples.map((example, index) => (
                                <div key={index} className="flex gap-2">
                                  <textarea
                                    value={example}
                                    onChange={(e) => {
                                      const newExamples = [...phase.reflectionExamples];
                                      newExamples[index] = e.target.value;
                                      updateSettings(`phases.${phaseKey}.reflectionExamples`, newExamples);
                                    }}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                                    rows={2}
                                  />
                                  <button
                                    onClick={() => {
                                      const newExamples = phase.reflectionExamples.filter((_, i) => i !== index);
                                      updateSettings(`phases.${phaseKey}.reflectionExamples`, newExamples);
                                    }}
                                    className="px-3 py-2 text-red-600 hover:text-red-800"
                                  >
                                    Remove
                                  </button>
                                </div>
                              ))}
                              <button
                                onClick={() => {
                                  const newExamples = [...phase.reflectionExamples, ''];
                                  updateSettings(`phases.${phaseKey}.reflectionExamples`, newExamples);
                                }}
                                className="px-4 py-2 text-sm bg-purple-50 text-purple-600 rounded-md hover:bg-purple-100"
                              >
                                Add Reflection Example
                              </button>
                            </div>
                          </div>

                          {/* Phase Transition Controls */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Completion Threshold: {phase.completionThreshold}/10
                              </label>
                              <input
                                type="range"
                                min="1"
                                max="10"
                                value={phase.completionThreshold}
                                onChange={(e) => updateSettings(`phases.${phaseKey}.completionThreshold`, parseInt(e.target.value))}
                                className="w-full"
                              />
                              <span className="text-xs text-gray-500">How confident to proceed to next phase</span>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Max Follow-ups: {phase.maxFollowUps}
                              </label>
                              <input
                                type="range"
                                min="0"
                                max="5"
                                value={phase.maxFollowUps}
                                onChange={(e) => updateSettings(`phases.${phaseKey}.maxFollowUps`, parseInt(e.target.value))}
                                className="w-full"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Transition Aggressiveness
                              </label>
                              <select
                                value={phase.transitionAggressiveness}
                                onChange={(e) => updateSettings(`phases.${phaseKey}.transitionAggressiveness`, e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                              >
                                <option value="gentle">Gentle - Wait for clear signals</option>
                                <option value="moderate">Moderate - Balance patience with progress</option>
                                <option value="assertive">Assertive - Move forward confidently</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                )}

                {/* Response and Safety Guidelines - Only show in Advanced mode */}
                {settings.mode === 'advanced' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Response Guidelines</h3>
                    <textarea
                      value={settings.systemInstructions.responseGuidelines}
                      onChange={(e) => updateSettings('systemInstructions.responseGuidelines', e.target.value)}
                      className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Guidelines for responses..."
                    />
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Safety Guidelines</h3>
                    <textarea
                      value={settings.systemInstructions.safetyGuidelines}
                      onChange={(e) => updateSettings('systemInstructions.safetyGuidelines', e.target.value)}
                      className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Safety and moderation guidelines..."
                    />
                  </div>
                </div>
                )}
              </div>
            )}

            {/* Model Tab */}
            {activeTab === 'model' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Model Configuration</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Model Name
                      </label>
                      <select
                        value={settings.model.name}
                        onChange={(e) => updateSettings('model.name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="gpt-4-turbo-preview">GPT-4 Turbo Preview</option>
                        <option value="gpt-4">GPT-4</option>
                        <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                        <option value="claude-3-opus">Claude 3 Opus</option>
                        <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Tokens: {settings.model.max_output_tokens}
                      </label>
                      <input
                        type="range"
                        min="100"
                        max="4000"
                        step="100"
                        value={settings.model.max_output_tokens}
                        onChange={(e) => updateSettings('model.max_output_tokens', parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Generation Parameters</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Temperature: {settings.model.temperature.toFixed(2)}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={settings.model.temperature}
                        onChange={(e) => updateSettings('model.temperature', parseFloat(e.target.value))}
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500 mt-1">Controls randomness (0 = deterministic, 1 = creative)</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Top P: {settings.model.top_p.toFixed(2)}
                      </label>
                      <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.05"
                        value={settings.model.top_p}
                        onChange={(e) => updateSettings('model.top_p', parseFloat(e.target.value))}
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500 mt-1">Controls diversity via nucleus sampling</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Flow Tab */}
            {activeTab === 'flow' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Phase Control</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Starting Phase
                      </label>
                      <select
                        value={settings.flow.start_phase}
                        onChange={(e) => updateSettings('flow.start_phase', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        {['name_it', 'beneath', 'why', 'coparent', 'child', 'options', 'choose'].map(phase => (
                          <option key={phase} value={phase}>
                            {phase.replace('_', ' ').charAt(0).toUpperCase() + phase.slice(1).replace('_', ' ')}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Auto-Advance Mode
                      </label>
                      <select
                        value={settings.flow.auto_advance}
                        onChange={(e) => updateSettings('flow.auto_advance', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="smart">Smart (AI decides)</option>
                        <option value="manual">Manual (user controls)</option>
                        <option value="always">Always (force progression)</option>
                      </select>
                    </div>

                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.flow.allow_user_jump}
                          onChange={(e) => updateSettings('flow.allow_user_jump', e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-sm font-medium">Allow users to skip phases</span>
                      </label>
                    </div>

                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.flow.skip_if_confident}
                          onChange={(e) => updateSettings('flow.skip_if_confident', e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-sm font-medium">Skip phases when AI is confident</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Progression Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Follow-ups per Phase: {settings.flow.max_followups_per_phase}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="5"
                        value={settings.flow.max_followups_per_phase}
                        onChange={(e) => updateSettings('flow.max_followups_per_phase', parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Draft Ready Score: {(settings.flow.draft_when_ready_score * 100).toFixed(0)}%
                      </label>
                      <input
                        type="range"
                        min="50"
                        max="95"
                        value={settings.flow.draft_when_ready_score * 100}
                        onChange={(e) => updateSettings('flow.draft_when_ready_score', parseInt(e.target.value) / 100)}
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Confidence threshold for offering to draft message
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Probing Tab */}
            {activeTab === 'probing' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Probing Behavior</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.probing.enable_reflections}
                          onChange={(e) => updateSettings('probing.enable_reflections', e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-sm font-medium">Enable reflective responses</span>
                      </label>
                    </div>

                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.probing.probe_on_uncertainty}
                          onChange={(e) => updateSettings('probing.probe_on_uncertainty', e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-sm font-medium">Probe when uncertain</span>
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Probe Depth: {settings.probing.max_probe_depth}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="5"
                        value={settings.probing.max_probe_depth}
                        onChange={(e) => updateSettings('probing.max_probe_depth', parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Probe Triggers & Softeners</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Triggers</label>
                      <div className="space-y-2">
                        {(['low_confidence', 'missing_key_field', 'emotional_incongruence'] as const).map(trigger => (
                          <label key={trigger} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={settings.probing.probe_triggers.includes(trigger)}
                              onChange={(e) => {
                                const triggers = e.target.checked
                                  ? [...settings.probing.probe_triggers, trigger]
                                  : settings.probing.probe_triggers.filter(t => t !== trigger);
                                updateSettings('probing.probe_triggers', triggers);
                              }}
                              className="mr-2"
                            />
                            <span className="text-sm">{trigger.replace(/_/g, ' ')}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Softeners</label>
                      <div className="space-y-2">
                        {(['optional_invite', 'acknowledge_effort', 'normalize_experience'] as const).map(softener => (
                          <label key={softener} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={settings.probing.probe_softeners.includes(softener)}
                              onChange={(e) => {
                                const softeners = e.target.checked
                                  ? [...settings.probing.probe_softeners, softener]
                                  : settings.probing.probe_softeners.filter(s => s !== softener);
                                updateSettings('probing.probe_softeners', softeners);
                              }}
                              className="mr-2"
                            />
                            <span className="text-sm">{softener.replace(/_/g, ' ')}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tone Tab */}
            {activeTab === 'tone' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Conversation Tone</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Warmth Level
                      </label>
                      <select
                        value={settings.tone.warmth}
                        onChange={(e) => updateSettings('tone.warmth', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="low">Low - Professional</option>
                        <option value="medium">Medium - Friendly</option>
                        <option value="high">High - Empathetic</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Directness Level
                      </label>
                      <select
                        value={settings.tone.directness}
                        onChange={(e) => updateSettings('tone.directness', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="low">Low - Gentle</option>
                        <option value="medium">Medium - Balanced</option>
                        <option value="high">High - Direct</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Language Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.tone.avoid_performative_empathy}
                          onChange={(e) => updateSettings('tone.avoid_performative_empathy', e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-sm font-medium">Avoid performative empathy</span>
                      </label>
                      <p className="text-xs text-gray-500 ml-6">Keep responses sincere and genuine</p>
                    </div>

                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.tone.use_plain_language}
                          onChange={(e) => updateSettings('tone.use_plain_language', e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-sm font-medium">Use plain language</span>
                      </label>
                      <p className="text-xs text-gray-500 ml-6">Avoid jargon and clinical terms</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Safety Tab */}
            {activeTab === 'safety' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Safety Controls</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Escalation Detection
                      </label>
                      <select
                        value={settings.safety.escalation_detection}
                        onChange={(e) => updateSettings('safety.escalation_detection', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="off">Off</option>
                        <option value="standard">Standard</option>
                        <option value="sensitive">Sensitive</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Regulation Action
                      </label>
                      <select
                        value={settings.safety.regulation_action}
                        onChange={(e) => updateSettings('safety.regulation_action', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="offer_pause">Offer Pause</option>
                        <option value="brief_grounding">Brief Grounding Exercise</option>
                      </select>
                    </div>

                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.safety.legal_therapy_disclaimer}
                          onChange={(e) => updateSettings('safety.legal_therapy_disclaimer', e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-sm font-medium">Show legal/therapy disclaimer</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Outputs Tab */}
            {activeTab === 'outputs' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Output Format</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Summary Detail
                      </label>
                      <select
                        value={settings.outputs.include_summary}
                        onChange={(e) => updateSettings('outputs.include_summary', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="none">None</option>
                        <option value="minimal">Minimal</option>
                        <option value="full">Full</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CLEAR Message Format
                      </label>
                      <select
                        value={settings.outputs.clear_message_format}
                        onChange={(e) => updateSettings('outputs.clear_message_format', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="bulleted_then_block">Bulleted Points + Block</option>
                        <option value="single_block">Single Block</option>
                      </select>
                    </div>

                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.outputs.show_reasoning_breadcrumbs}
                          onChange={(e) => updateSettings('outputs.show_reasoning_breadcrumbs', e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-sm font-medium">Show AI reasoning</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Alternative Tones</h3>
                  <div className="space-y-2">
                    {(['softer', 'firmer', 'shorter'] as const).map(tone => (
                      <label key={tone} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.outputs.offer_alt_tones.includes(tone)}
                          onChange={(e) => {
                            const tones = e.target.checked
                              ? [...settings.outputs.offer_alt_tones, tone]
                              : settings.outputs.offer_alt_tones.filter(t => t !== tone);
                            updateSettings('outputs.offer_alt_tones', tones);
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm font-medium capitalize">{tone} tone option</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Memory Tab */}
            {activeTab === 'memory' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Session Management</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.memory.persist_session}
                          onChange={(e) => updateSettings('memory.persist_session', e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-sm font-medium">Persist sessions</span>
                      </label>
                    </div>

                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.memory.redact_pii}
                          onChange={(e) => updateSettings('memory.redact_pii', e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-sm font-medium">Redact PII automatically</span>
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Retention Days: {settings.memory.retention_days}
                      </label>
                      <input
                        type="range"
                        min="7"
                        max="365"
                        value={settings.memory.retention_days}
                        onChange={(e) => updateSettings('memory.retention_days', parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Glossary & Help</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.glossary.offer_lists_on_request}
                          onChange={(e) => updateSettings('glossary.offer_lists_on_request', e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-sm font-medium">Offer lists on request</span>
                      </label>
                    </div>

                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.glossary.auto_offer_if_stuck}
                          onChange={(e) => updateSettings('glossary.auto_offer_if_stuck', e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-sm font-medium">Auto-offer help if stuck</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Profile Context Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Profile Context Settings</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Configure how much user profile information the AI assistant includes in its responses to personalize the experience.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Core Settings */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900">Core Settings</h4>
                      
                      <div>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={settings.profileContext?.enabled || false}
                            onChange={(e) => updateSettings('profileContext.enabled', e.target.checked)}
                            className="mr-2"
                          />
                          <span className="text-sm font-medium">Enable Profile Context</span>
                        </label>
                        <p className="text-xs text-gray-500 mt-1">
                          Use user profile information to personalize responses
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Context Level
                        </label>
                        <select
                          value={settings.profileContext?.level || 'moderate'}
                          onChange={(e) => updateSettings('profileContext.level', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                          <option value="none">None - No profile context</option>
                          <option value="basic">Basic - Names and basic info only</option>
                          <option value="moderate">Moderate - Basic + goals and challenges</option>
                          <option value="full">Full - All available profile information</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                          Controls how much profile information is included in AI context
                        </p>
                      </div>
                    </div>
                    
                    {/* Category Settings */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900">Information Categories</h4>
                      
                      <div>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={settings.profileContext?.includeChildren || false}
                            onChange={(e) => updateSettings('profileContext.includeChildren', e.target.checked)}
                            className="mr-2"
                          />
                          <span className="text-sm font-medium">Children Information</span>
                        </label>
                        <p className="text-xs text-gray-500 mt-1">
                          Names, ages, grades, interests, and activities
                        </p>
                      </div>
                      
                      <div>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={settings.profileContext?.includeFamily || false}
                            onChange={(e) => updateSettings('profileContext.includeFamily', e.target.checked)}
                            className="mr-2"
                          />
                          <span className="text-sm font-medium">Extended Family</span>
                        </label>
                        <p className="text-xs text-gray-500 mt-1">
                          Grandparents, step-parents, siblings involved in co-parenting
                        </p>
                      </div>
                      
                      <div>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={settings.profileContext?.includeProfessionals || false}
                            onChange={(e) => updateSettings('profileContext.includeProfessionals', e.target.checked)}
                            className="mr-2"
                          />
                          <span className="text-sm font-medium">Professional Team</span>
                        </label>
                        <p className="text-xs text-gray-500 mt-1">
                          Attorneys, mediators, therapists, and other professionals
                        </p>
                      </div>
                      
                      <div>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={settings.profileContext?.includeFinancial || false}
                            onChange={(e) => updateSettings('profileContext.includeFinancial', e.target.checked)}
                            className="mr-2"
                          />
                          <span className="text-sm font-medium">Financial Arrangements</span>
                        </label>
                        <p className="text-xs text-gray-500 mt-1">
                          Child support, shared expenses, financial responsibilities
                        </p>
                      </div>
                      
                      <div>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={settings.profileContext?.includeMedical || false}
                            onChange={(e) => updateSettings('profileContext.includeMedical', e.target.checked)}
                            className="mr-2"
                          />
                          <span className="text-sm font-medium">Medical Information</span>
                        </label>
                        <p className="text-xs text-gray-500 mt-1">
                          Insurance, allergies, medications, special needs
                        </p>
                      </div>
                      
                      <div>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={settings.profileContext?.includeCustody || false}
                            onChange={(e) => updateSettings('profileContext.includeCustody', e.target.checked)}
                            className="mr-2"
                          />
                          <span className="text-sm font-medium">Custody Arrangements</span>
                        </label>
                        <p className="text-xs text-gray-500 mt-1">
                          Schedules, exchange details, holiday arrangements
                        </p>
                      </div>
                      
                      <div>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={settings.profileContext?.includeHistory || false}
                            onChange={(e) => updateSettings('profileContext.includeHistory', e.target.checked)}
                            className="mr-2"
                          />
                          <span className="text-sm font-medium">Background History</span>
                        </label>
                        <p className="text-xs text-gray-500 mt-1">
                          Separation details, cultural considerations, special circumstances
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Privacy Notice */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-start">
                    <ExclamationTriangleIcon className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-900">Privacy & Security</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Profile information is only used to personalize AI responses for better support. 
                        It is not stored in conversation logs and follows the same privacy standards as all user data.
                        Users control what information they share in their profiles.
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Context Preview */}
                {settings.profileContext?.enabled && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h4 className="font-medium text-gray-900 mb-3">Context Preview</h4>
                    <div className="bg-gray-50 rounded p-4">
                      <div className="text-sm text-gray-600 mb-2">
                        Sample context format based on current settings:
                      </div>
                      <div className="text-xs font-mono bg-white p-3 rounded border">
                        <div className="text-blue-600">## User Context</div>
                        <div className="mt-2">
                          <strong>User:</strong> John Smith<br />
                          <strong>Co-parent:</strong> Jane Smith
                        </div>
                        {settings.profileContext?.includeChildren && (
                          <div className="mt-2">
                            <strong>Children:</strong><br />
                            • Emma, age 8, 3rd grade<br />
                            • Liam, age 5, Kindergarten
                          </div>
                        )}
                        {settings.profileContext?.level !== 'none' && (
                          <div className="mt-2">
                            <strong>Co-parenting goals:</strong> Consistent routines, unified discipline<br />
                            <strong>Conflict areas:</strong> Screen time, extracurricular activities
                          </div>
                        )}
                        <div className="text-gray-500 mt-2">
                          Level: {settings.profileContext?.level || 'moderate'} | Categories enabled: {[
                            settings.profileContext?.includeChildren && 'children',
                            settings.profileContext?.includeFamily && 'family',
                            settings.profileContext?.includeProfessionals && 'professionals',
                            settings.profileContext?.includeFinancial && 'financial',
                            settings.profileContext?.includeMedical && 'medical',
                            settings.profileContext?.includeCustody && 'custody',
                            settings.profileContext?.includeHistory && 'history'
                          ].filter(Boolean).join(', ') || 'none'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Knowledge Base Tab */}
            {activeTab === 'knowledge' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Knowledge Base Management</h3>
                    <div className="flex items-center space-x-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.knowledgeBase.searchEnabled}
                          onChange={(e) => updateSettings('knowledgeBase.searchEnabled', e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-sm font-medium">Enable search</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.knowledgeBase.autoSuggest}
                          onChange={(e) => updateSettings('knowledgeBase.autoSuggest', e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-sm font-medium">Auto-suggest</span>
                      </label>
                    </div>
                  </div>

                  {/* Document Upload Section */}
                  <div className="mb-6">
                    <div 
                      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                        dragOver 
                          ? 'border-orange-500 bg-orange-50' 
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e)}
                    >
                      <CloudArrowUpIcon className={`h-12 w-12 mx-auto mb-4 ${dragOver ? 'text-orange-500' : 'text-gray-400'}`} />
                      <div className="text-lg font-medium text-gray-900 mb-2">
                        {uploadingFile ? 'Processing files...' : 'Upload Knowledge Documents'}
                      </div>
                      <div className="text-sm text-gray-600 mb-4">
                        Drag and drop files here, or click to browse
                      </div>
                      <div className="text-xs text-gray-500 mb-4">
                        Supported formats: PDF, TXT, MD, HTML, CSV, DOC, DOCX, XLS, XLSX, PPT, PPTX, RTF, JSON, ODT, ODS, ODP
                      </div>
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.txt,.md,.html,.csv,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.rtf,.json,.odt,.ods,.odp"
                        onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                        className="hidden"
                        id="document-upload"
                        disabled={uploadingFile}
                      />
                      <label 
                        htmlFor="document-upload" 
                        className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                          uploadingFile 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-orange-600 hover:bg-orange-700 cursor-pointer'
                        }`}
                      >
                        <DocumentIcon className="h-4 w-4 mr-2" />
                        {uploadingFile ? 'Processing...' : 'Choose Files'}
                      </label>
                    </div>

                    {/* Uploaded Documents List */}
                    {settings.knowledgeBase.documents.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-md font-medium text-gray-900 mb-3">Uploaded Documents</h4>
                        <div className="space-y-2">
                          {settings.knowledgeBase.documents.map((doc, index) => (
                            <div key={doc.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3 hover:bg-gray-100 cursor-pointer" onClick={() => handleDocumentClick(doc)}>
                              <div className="flex items-center">
                                {React.createElement(getDocumentIcon(doc.originalName || doc.filename || ''), { className: "h-5 w-5 text-gray-400 mr-3" })}
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{doc.originalName || doc.filename || 'Unnamed Document'}</div>
                                  <div className="text-xs text-gray-500">
                                    {doc.fileSize ? `${(doc.fileSize / 1024).toFixed(1)} KB` : 'Size unknown'} • 
                                    {doc.uploadDate ? new Date(doc.uploadDate).toLocaleDateString() : 'Date unknown'}
                                    {doc.processingStatus === 'completed' 
                                      ? ` • ✓ ${doc.chunkCount || 0} chunks` 
                                      : doc.processingStatus === 'error'
                                      ? ' • ⚠️ Processing failed'
                                      : doc.processed 
                                      ? ' • Processed' 
                                      : ' • Processing...'}
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation(); // Prevent triggering document click
                                  if (window.confirm(`Are you sure you want to delete "${doc.originalName || doc.filename || 'this document'}"? This action cannot be undone.`)) {
                                    try {
                                      await documentsApi.deleteDocument(doc.id);
                                      const newDocs = settings.knowledgeBase.documents.filter((_, i) => i !== index);
                                      updateSettings('knowledgeBase.documents', newDocs);
                                    } catch (error: any) {
                                      console.error('Error deleting document:', error);
                                      alert(`Error deleting document: ${error.message || error}`);
                                    }
                                  }
                                }}
                                className="p-1 text-red-500 hover:text-red-700"
                              >
                                <XMarkIcon className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Categories */}
                  <div className="space-y-6">
                    {settings.knowledgeBase.categories.map((category, categoryIndex) => (
                      <div key={category.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <input
                              type="text"
                              value={category.name}
                              onChange={(e) => updateSettings(`knowledgeBase.categories.${categoryIndex}.name`, e.target.value)}
                              className="text-lg font-semibold bg-transparent border-none p-0 focus:outline-none focus:ring-0 w-full"
                              placeholder="Category name"
                            />
                            <textarea
                              value={category.description}
                              onChange={(e) => updateSettings(`knowledgeBase.categories.${categoryIndex}.description`, e.target.value)}
                              className="mt-1 text-sm text-gray-600 bg-transparent border-none p-0 focus:outline-none focus:ring-0 w-full resize-none"
                              placeholder="Category description"
                              rows={1}
                            />
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="file"
                              multiple
                              accept=".pdf,.txt,.md,.html,.csv,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.rtf,.json,.odt,.ods,.odp"
                              onChange={(e) => e.target.files && handleFileUpload(e.target.files, category.id)}
                              className="hidden"
                              id={`category-upload-${category.id}`}
                              disabled={uploadingFile}
                            />
                            <label 
                              htmlFor={`category-upload-${category.id}`}
                              className="inline-flex items-center px-2 py-1 text-xs font-medium text-orange-600 bg-orange-100 rounded hover:bg-orange-200 cursor-pointer"
                            >
                              <CloudArrowUpIcon className="h-3 w-3 mr-1" />
                              Upload
                            </label>
                            <button
                              onClick={() => {
                                const newCategories = settings.knowledgeBase.categories.filter((_, i) => i !== categoryIndex);
                                updateSettings('knowledgeBase.categories', newCategories);
                              }}
                              className="p-1 text-red-500 hover:text-red-700"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Articles */}
                        <div className="space-y-3 ml-4">
                          {category.articles.map((article, articleIndex) => (
                            <div key={article.id} className="bg-gray-50 rounded p-3">
                              <div className="flex justify-between items-start mb-2">
                                <input
                                  type="text"
                                  value={article.title}
                                  onChange={(e) => updateSettings(`knowledgeBase.categories.${categoryIndex}.articles.${articleIndex}.title`, e.target.value)}
                                  className="font-medium bg-transparent border-none p-0 focus:outline-none focus:ring-0 flex-1"
                                  placeholder="Article title"
                                />
                                <button
                                  onClick={() => {
                                    const newArticles = category.articles.filter((_, i) => i !== articleIndex);
                                    updateSettings(`knowledgeBase.categories.${categoryIndex}.articles`, newArticles);
                                  }}
                                  className="ml-2 p-1 text-red-500 hover:text-red-700"
                                >
                                  <TrashIcon className="h-3 w-3" />
                                </button>
                              </div>
                              
                              <textarea
                                value={article.content}
                                onChange={(e) => updateSettings(`knowledgeBase.categories.${categoryIndex}.articles.${articleIndex}.content`, e.target.value)}
                                className="w-full text-sm bg-transparent border-none p-0 focus:outline-none focus:ring-0 resize-none"
                                placeholder="Article content"
                                rows={3}
                              />
                              
                              <div className="mt-2 flex items-center justify-between">
                                <div className="flex-1">
                                  <input
                                    type="text"
                                    value={article.tags.join(', ')}
                                    onChange={(e) => updateSettings(`knowledgeBase.categories.${categoryIndex}.articles.${articleIndex}.tags`, e.target.value.split(', ').filter(tag => tag.trim()))}
                                    className="text-xs text-gray-500 bg-transparent border-none p-0 focus:outline-none focus:ring-0 w-full"
                                    placeholder="Tags (comma separated)"
                                  />
                                  {article.sourceDocument && (
                                    <div className="text-xs text-blue-600 flex items-center mt-1">
                                      <DocumentIcon className="h-3 w-3 mr-1" />
                                      From: {article.sourceDocument.filename}
                                    </div>
                                  )}
                                </div>
                                <span className="text-xs text-gray-400 ml-2">
                                  Updated: {new Date(article.lastUpdated).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          ))}
                          
                          <button
                            onClick={() => {
                              const newArticle = {
                                id: Date.now().toString(),
                                title: 'New Article',
                                content: '',
                                tags: [],
                                lastUpdated: new Date().toISOString()
                              };
                              const newArticles = [...category.articles, newArticle];
                              updateSettings(`knowledgeBase.categories.${categoryIndex}.articles`, newArticles);
                            }}
                            className="w-full border border-dashed border-gray-300 rounded p-2 text-gray-500 hover:text-gray-700 hover:border-gray-400 flex items-center justify-center"
                          >
                            <PlusIcon className="h-4 w-4 mr-1" />
                            Add Article
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    <button
                      onClick={() => {
                        const newCategory = {
                          id: Date.now().toString(),
                          name: 'New Category',
                          description: '',
                          articles: []
                        };
                        const newCategories = [...settings.knowledgeBase.categories, newCategory];
                        updateSettings('knowledgeBase.categories', newCategories);
                      }}
                      className="w-full border border-dashed border-gray-300 rounded-lg p-4 text-gray-500 hover:text-gray-700 hover:border-gray-400 flex items-center justify-center"
                    >
                      <BookOpenIcon className="h-5 w-5 mr-2" />
                      Add Category
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Retrieval Tab */}
            {activeTab === 'retrieval' && settings.retrieval && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">RAG Retrieval Settings</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Configure Retrieval-Augmented Generation to enhance responses with your uploaded documents.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Core Settings */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900">Core Settings</h4>
                      
                      <div>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={settings.retrieval?.enabled || false}
                            onChange={(e) => updateSettings('retrieval.enabled', e.target.checked)}
                            className="mr-2"
                          />
                          <span className="text-sm font-medium">Enable RAG Retrieval</span>
                        </label>
                        <p className="text-xs text-gray-500 mt-1">
                          Use uploaded documents to enhance AI responses
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Top-K Chunks: {settings.retrieval?.k || 8}
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="20"
                          value={settings.retrieval?.k || 8}
                          onChange={(e) => updateSettings('retrieval.k', parseInt(e.target.value))}
                          className="w-full"
                        />
                        <p className="text-xs text-gray-500">Number of document chunks to retrieve</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Min Score: {settings.retrieval?.minScore || 0.30}
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={settings.retrieval?.minScore || 0.30}
                          onChange={(e) => updateSettings('retrieval.minScore', parseFloat(e.target.value))}
                          className="w-full"
                        />
                        <p className="text-xs text-gray-500">Minimum relevance score for chunks</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Max Per Document: {settings.retrieval?.maxPerDoc || 3}
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={settings.retrieval?.maxPerDoc || 3}
                          onChange={(e) => updateSettings('retrieval.maxPerDoc', parseInt(e.target.value))}
                          className="w-full"
                        />
                        <p className="text-xs text-gray-500">Maximum chunks from any single document</p>
                      </div>
                    </div>

                    {/* Advanced Settings */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900">Advanced Settings</h4>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Hybrid Weight: {settings.retrieval?.hybridWeight || 0.5}
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={settings.retrieval?.hybridWeight || 0.5}
                          onChange={(e) => updateSettings('retrieval.hybridWeight', parseFloat(e.target.value))}
                          className="w-full"
                        />
                        <p className="text-xs text-gray-500">
                          Balance between semantic (1.0) and keyword (0.0) search
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Rerank Top-N: {settings.retrieval?.rerankTopN || 50}
                        </label>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          step="10"
                          value={settings.retrieval?.rerankTopN || 50}
                          onChange={(e) => updateSettings('retrieval.rerankTopN', parseInt(e.target.value))}
                          className="w-full"
                        />
                        <p className="text-xs text-gray-500">Number of candidates before reranking</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Max Context Tokens: {settings.retrieval?.maxTokens || 2000}
                        </label>
                        <input
                          type="range"
                          min="500"
                          max="4000"
                          step="100"
                          value={settings.retrieval?.maxTokens || 2000}
                          onChange={(e) => updateSettings('retrieval.maxTokens', parseInt(e.target.value))}
                          className="w-full"
                        />
                        <p className="text-xs text-gray-500">Maximum tokens for retrieved context</p>
                      </div>

                      <div>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={settings.retrieval?.enforceACL || true}
                            onChange={(e) => updateSettings('retrieval.enforceACL', e.target.checked)}
                            className="mr-2"
                          />
                          <span className="text-sm font-medium">Enforce Access Control</span>
                        </label>
                        <p className="text-xs text-gray-500 mt-1">
                          Only retrieve from user's own documents
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Context Preview */}
                {settings.retrieval?.enabled && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h4 className="font-medium text-gray-900 mb-3">Context Preview</h4>
                    <div className="bg-gray-50 rounded p-4">
                      <div className="text-sm text-gray-600 mb-2">
                        Sample context format with {settings.retrieval?.k || 8} chunks:
                      </div>
                      <div className="text-xs font-mono bg-white p-3 rounded border">
                        <div className="text-blue-600">## Retrieved Context</div>
                        <div className="mt-2">
                          <strong>[BeAligned™ Editor's Guidebook — Mission & Guardrails — Section 1]</strong><br />
                          BeAligned™ reduces conflict and increases parental alignment. We focus on the future and what the children need, not past grievances.
                        </div>
                        <div className="mt-2">
                          <strong>[BeAligned™ Editor's Guidebook — B.A.L.A.N.C.E. Framework — Section 2]</strong><br />
                          Boundaries Framework Core Idea: Boundaries only work when they are mutual, clear, and consistently maintained by both parents.
                        </div>
                        <div className="mt-2">
                          <strong>[BeAligned™ Editor's Guidebook — Third Side Perspective — Section 3]</strong><br />
                          The "Third Side" is the bigger perspective — stepping back to see the whole picture, especially from the children's point of view.
                        </div>
                        <div className="text-gray-500 mt-2">
                          Max tokens: {settings.retrieval?.maxTokens || 2000} | Max per doc: {settings.retrieval?.maxPerDoc || 3}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Global Save/Cancel Buttons for all configurable tabs */}
          {['greeting', 'instructions', 'model', 'flow', 'probing', 'tone', 'safety', 'outputs', 'memory', 'profile', 'retrieval'].includes(activeTab) && (
            <div className="bg-white rounded-lg shadow p-6 mt-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  {saveStatus === 'success' && (
                    <span className="flex items-center text-green-600">
                      <CheckCircleIcon className="h-5 w-5 mr-2" />
                      Settings saved successfully
                    </span>
                  )}
                  {saveStatus === 'error' && (
                    <span className="flex items-center text-red-600">
                      <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                      Failed to save settings
                    </span>
                  )}
                </div>
                
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors"
                    disabled={saving}
                  >
                    <ArrowPathIcon className="h-4 w-4 inline mr-2" />
                    Reset to Defaults
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!hasChanges || saving}
                    className={`px-6 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors ${
                      hasChanges && !saving
                        ? 'bg-orange-600 text-white hover:bg-orange-700' 
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <DocumentArrowDownIcon className="h-4 w-4 inline mr-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Document Detail Modal */}
      {selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center">
                {React.createElement(getDocumentIcon(selectedDocument.originalName || selectedDocument.filename || ''), { className: "h-6 w-6 text-gray-400 mr-3" })}
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {selectedDocument.originalName || selectedDocument.filename || 'Unnamed Document'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {selectedDocument.fileSize ? `${(selectedDocument.fileSize / 1024).toFixed(1)} KB` : 'Size unknown'} • 
                    {selectedDocument.uploadDate ? new Date(selectedDocument.uploadDate).toLocaleDateString() : 'Date unknown'}
                    {selectedDocument.processingStatus === 'completed' 
                      ? ` • ✓ ${selectedDocument.chunkCount || 0} chunks` 
                      : selectedDocument.processingStatus === 'error'
                      ? ' • ⚠️ Processing failed'
                      : selectedDocument.processed 
                      ? ' • Processed' 
                      : ' • Processing...'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDocument(null)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              {loadingChunks ? (
                <div className="flex items-center justify-center py-8">
                  <ArrowPathIcon className="h-6 w-6 animate-spin text-gray-400 mr-2" />
                  <span className="text-gray-500">Loading chunks...</span>
                </div>
              ) : documentChunks.length > 0 ? (
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-900">Document Chunks ({documentChunks.length})</h4>
                  {documentChunks.map((chunk, index) => (
                    <div key={chunk.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-500">Chunk {chunk.chunk_index + 1}</span>
                        <span className="text-xs text-gray-400">
                          {new Date(chunk.created_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded border max-h-32 overflow-y-auto">
                        {chunk.content}
                      </div>
                      {chunk.metadata && (
                        <div className="mt-2 text-xs text-gray-500">
                          <strong>Metadata:</strong> {JSON.stringify(chunk.metadata)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <DocumentIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No chunks found for this document.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};