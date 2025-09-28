import { useState, useEffect, useCallback } from 'react';
import { ReflectionStep, defaultReflectionSteps } from '../components/ReflectionTracker';
import { conversationApi } from '../services/api';

export const useReflectionTracking = (messageCount: number, initialPhase?: number, conversationId?: string) => {
  // Load tracker visibility from localStorage
  const [isTrackerVisible, setIsTrackerVisible] = useState(() => {
    const saved = localStorage.getItem('reflectionTrackerVisible');
    return saved !== null ? JSON.parse(saved) : true;
  });
  
  const [steps, setSteps] = useState<ReflectionStep[]>(() => 
    defaultReflectionSteps.map((step, index) => ({
      ...step,
      status: index === 0 ? 'active' : 'pending',
      summary: undefined
    }))
  );
  const [currentPhase, setCurrentPhase] = useState(initialPhase || 1);
  const [stepSummaries, setStepSummaries] = useState<Record<number, string>>({});

  // Update backend when phase changes
  useEffect(() => {
    if (conversationId && currentPhase !== initialPhase) {
      // Sync phase to backend
      conversationApi.updatePhase(conversationId, currentPhase, stepSummaries[currentPhase])
        .catch(error => console.error('Failed to update phase in backend:', error));
    }
  }, [currentPhase, conversationId]);

  // Update phase when initialPhase prop changes (from backend)
  useEffect(() => {
    if (initialPhase && initialPhase !== currentPhase) {
      updatePhaseProgress(initialPhase);
    }
  }, [initialPhase]);

  // Toggle tracker visibility and save to localStorage
  const toggleTracker = useCallback(() => {
    setIsTrackerVisible((prev: boolean) => {
      const newState = !prev;
      localStorage.setItem('reflectionTrackerVisible', JSON.stringify(newState));
      return newState;
    });
  }, []);

  // Don't auto-progress based on message count alone
  // Phase progression should be based on actual conversation content
  // This effect is disabled to prevent incorrect phase tracking
  /*
  useEffect(() => {
    // Roughly 2-3 message exchanges per step
    const phaseIndex = Math.min(Math.floor(messageCount / 2), defaultReflectionSteps.length);
    
    if (phaseIndex > 0 && phaseIndex !== currentPhase) {
      updatePhaseProgress(phaseIndex);
    }
  }, [messageCount]);
  */

  const updatePhaseProgress = useCallback((newPhaseIndex: number, autoDetected: boolean = false) => {
    setSteps(prevSteps => 
      prevSteps.map((step, index) => {
        if (index < newPhaseIndex - 1) {
          return { 
            ...step, 
            status: 'completed',
            summary: stepSummaries[step.id] || step.summary
          };
        } else if (index === newPhaseIndex - 1) {
          return { ...step, status: 'active' };
        } else {
          return { ...step, status: 'pending' };
        }
      })
    );
    setCurrentPhase(newPhaseIndex);
    
    // If auto-detected, log it for debugging
    if (autoDetected) {
      console.log(`✅ Auto-detected progression to Phase ${newPhaseIndex}`);
    }
  }, [stepSummaries]);

  // Update step summary based on message content
  const updateStepSummary = useCallback((stepId: number, summary: string) => {
    setStepSummaries(prev => ({
      ...prev,
      [stepId]: summary
    }));
    
    setSteps(prevSteps => 
      prevSteps.map(step => {
        if (step.id === stepId) {
          return { ...step, summary };
        }
        return step;
      })
    );
  }, []);

  // Analyze message content to determine phase progression - ONLY from AI markers
  const analyzeMessageForPhase = useCallback((messageContent: string, isUserMessage: boolean = false) => {
    // ONLY process AI messages, ignore user messages completely
    if (isUserMessage) {
      return; // Frontend doesn't detect phases from user input
    }

    // Look for explicit phase indicators in format: [Phase X: Name]
    const phaseRegex = /\[Phase (\d+):\s*([^\]]+)\]/i;
    const match = messageContent.match(phaseRegex);
    
    if (match) {
      const detectedPhase = parseInt(match[1]);
      const phaseName = match[2].trim();
      
      // Only update if the detected phase is different from current
      if (detectedPhase !== currentPhase && detectedPhase >= 1 && detectedPhase <= 7) {
        // Mark all previous phases as complete
        for (let i = 1; i < detectedPhase; i++) {
          if (steps[i - 1]?.status !== 'completed') {
            updateStepSummary(i, `Phase ${i} completed`);
          }
        }
        
        // Set the new current phase (auto-detected)
        updatePhaseProgress(detectedPhase, true);
        
        // Update the summary for the new phase
        const phaseSummaries: { [key: number]: string } = {
          1: 'Identifying the situation',
          2: 'Exploring underlying feelings',
          3: 'Understanding why it matters',
          4: 'Considering co-parent\'s perspective',
          5: 'Focusing on child\'s needs',
          6: 'Exploring solution options',
          7: 'Crafting the message'
        };
        
        updateStepSummary(detectedPhase, phaseSummaries[detectedPhase] || phaseName);
      }
    }
    // Removed fallback keyword detection - only explicit AI phase markers are used
  }, [currentPhase, updatePhaseProgress, updateStepSummary, steps]);

  // Manual phase completion
  const completeCurrentPhase = useCallback(() => {
    if (currentPhase < defaultReflectionSteps.length) {
      updatePhaseProgress(currentPhase + 1);
    } else {
      // Mark all as completed
      setSteps(prevSteps => 
        prevSteps.map(step => ({ 
          ...step, 
          status: 'completed',
          summary: stepSummaries[step.id] || step.summary || 'Completed'
        }))
      );
    }
  }, [currentPhase, updatePhaseProgress, stepSummaries]);

  // Reset tracking
  const resetTracking = useCallback(() => {
    setSteps(defaultReflectionSteps.map((step, index) => ({
      ...step,
      status: index === 0 ? 'active' : 'pending',
      summary: undefined
    })));
    setCurrentPhase(1);
    setStepSummaries({});
  }, []);

  return {
    steps,
    currentPhase,
    totalPhases: defaultReflectionSteps.length,
    isTrackerVisible,
    toggleTracker,
    completeCurrentPhase,
    resetTracking,
    analyzeMessageForPhase,
    updateStepSummary
  };
};