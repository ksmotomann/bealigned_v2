import { useState, useEffect, useCallback } from 'react';
import { Step } from '../components/StepTracker';

// Default 7-step journey for BeAligned
const defaultSteps: Omit<Step, 'status' | 'timestamp'>[] = [
  {
    id: 1,
    title: 'Opening & Connection',
    description: 'Establishing rapport and understanding'
  },
  {
    id: 2,
    title: 'Current State Assessment',
    description: 'Exploring your current situation'
  },
  {
    id: 3,
    title: 'Goal Identification',
    description: 'Clarifying your objectives and desires'
  },
  {
    id: 4,
    title: 'Obstacle Recognition',
    description: 'Identifying challenges and barriers'
  },
  {
    id: 5,
    title: 'Strategy Development',
    description: 'Creating actionable solutions'
  },
  {
    id: 6,
    title: 'Implementation Planning',
    description: 'Defining concrete next steps'
  },
  {
    id: 7,
    title: 'Commitment & Closure',
    description: 'Solidifying your path forward'
  }
];

export const useStepTracking = (messageCount: number) => {
  const [steps, setSteps] = useState<Step[]>(() => 
    defaultSteps.map((step, index) => ({
      ...step,
      status: index === 0 ? 'in-progress' : 'pending',
      timestamp: undefined
    }))
  );

  const [currentStep, setCurrentStep] = useState(0);

  // Progress through steps based on message count
  // Roughly 3-4 message exchanges per step
  useEffect(() => {
    const stepIndex = Math.min(Math.floor(messageCount / 3), defaultSteps.length - 1);
    
    if (stepIndex !== currentStep) {
      updateStepProgress(stepIndex);
    }
  }, [messageCount]);

  const updateStepProgress = useCallback((newStepIndex: number) => {
    const now = new Date().toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit' 
    });

    setSteps(prevSteps => 
      prevSteps.map((step, index) => {
        if (index < newStepIndex) {
          return {
            ...step,
            status: 'completed',
            timestamp: step.timestamp || now
          };
        } else if (index === newStepIndex) {
          return {
            ...step,
            status: 'in-progress',
            timestamp: now
          };
        } else {
          return {
            ...step,
            status: 'pending',
            timestamp: undefined
          };
        }
      })
    );

    setCurrentStep(newStepIndex);
  }, []);

  const completeCurrentStep = useCallback(() => {
    if (currentStep < defaultSteps.length - 1) {
      updateStepProgress(currentStep + 1);
    } else {
      // Complete all steps
      const now = new Date().toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit' 
      });

      setSteps(prevSteps => 
        prevSteps.map(step => ({
          ...step,
          status: 'completed',
          timestamp: step.timestamp || now
        }))
      );
    }
  }, [currentStep, updateStepProgress]);

  const resetSteps = useCallback(() => {
    setSteps(defaultSteps.map((step, index) => ({
      ...step,
      status: index === 0 ? 'in-progress' : 'pending',
      timestamp: undefined
    })));
    setCurrentStep(0);
  }, []);

  // Advanced step detection based on message content
  const analyzeMessageForStep = useCallback((messageContent: string) => {
    const lowerContent = messageContent.toLowerCase();
    
    // Keywords for each step
    const stepKeywords = {
      1: ['hello', 'hi', 'welcome', 'thank you', 'nice to meet'],
      2: ['currently', 'right now', 'at the moment', 'present', 'situation'],
      3: ['goal', 'want', 'desire', 'hope', 'objective', 'achieve'],
      4: ['challenge', 'obstacle', 'difficulty', 'problem', 'barrier'],
      5: ['solution', 'strategy', 'approach', 'method', 'way'],
      6: ['plan', 'step', 'action', 'implement', 'next'],
      7: ['commit', 'promise', 'will do', 'agree', 'thank you', 'goodbye']
    };

    // Check which step the message most likely belongs to
    for (let stepNum = currentStep + 1; stepNum <= 7; stepNum++) {
      const keywords = stepKeywords[stepNum as keyof typeof stepKeywords];
      if (keywords.some(keyword => lowerContent.includes(keyword))) {
        // Move to this step if it's appropriate
        if (stepNum - currentStep <= 2) { // Don't jump too far ahead
          updateStepProgress(stepNum - 1);
        }
        break;
      }
    }
  }, [currentStep, updateStepProgress]);

  return {
    steps,
    currentStep,
    completeCurrentStep,
    resetSteps,
    analyzeMessageForStep
  };
};