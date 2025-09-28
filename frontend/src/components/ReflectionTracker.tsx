import React from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { HeartIcon, ChatBubbleLeftRightIcon, UserGroupIcon, EyeIcon, SparklesIcon, LightBulbIcon, HandRaisedIcon } from '@heroicons/react/24/outline';

export interface ReflectionStep {
  id: number;
  title: string;
  label: string; // The instruction label (e.g., "LET'S NAME IT")
  prompt: string; // The main prompt question
  description?: string; // Optional follow-up text
  summary?: string; // User's actual response summary (populated after completion)
  icon: React.ReactNode;
  status: 'pending' | 'active' | 'completed';
}

interface ReflectionTrackerProps {
  steps: ReflectionStep[];
  currentPhase: number;
  totalPhases: number;
}

export const ReflectionTracker: React.FC<ReflectionTrackerProps> = ({ 
  steps, 
  currentPhase, 
  totalPhases 
}) => {
  const progressPercentage = (steps.filter(s => s.status === 'completed').length / totalPhases) * 100;

  const getStepStyles = (step: ReflectionStep) => {
    if (step.status === 'completed') {
      return {
        container: 'border-green-500 bg-green-50',
        icon: 'text-green-600',
        text: 'text-gray-900',
        label: 'text-green-700 font-semibold',
        indicator: 'bg-green-500'
      };
    } else if (step.status === 'active') {
      return {
        container: 'border-indigo-500 bg-indigo-50 shadow-md',
        icon: 'text-indigo-600',
        text: 'text-indigo-900 font-medium',
        label: 'text-indigo-700 font-semibold',
        indicator: 'bg-indigo-500 animate-pulse'
      };
    } else {
      return {
        container: 'border-gray-200 bg-white',
        icon: 'text-gray-400',
        text: 'text-gray-500',
        label: 'text-gray-600',
        indicator: 'bg-gray-300'
      };
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Reflection Progress</h3>
        <p className="text-sm text-gray-500 mt-1">
          Track your journey through the process
        </p>
      </div>

      {/* Steps List */}
      <div className="flex-1 space-y-3 overflow-y-auto">
        {steps.map((step) => {
          const styles = getStepStyles(step);
          
          return (
            <div
              key={step.id}
              className={`relative flex items-start p-3 rounded-lg border transition-all duration-300 ${styles.container}`}
            >
              {/* Status Indicator */}
              <div className="flex-shrink-0 mr-3">
                {step.status === 'completed' ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                ) : step.status === 'active' ? (
                  <div className="relative">
                    <div className={`h-5 w-5 rounded-full border-2 border-indigo-500 bg-white`}>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-2 w-2 bg-indigo-500 rounded-full animate-pulse" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-gray-300 bg-white" />
                )}
              </div>

              {/* Step Content */}
              <div className="flex-1 min-w-0">
                {/* Step Label with Number */}
                <div className={`text-xs uppercase tracking-wide mb-1 ${styles.label}`}>
                  {step.id}. {step.label}
                </div>
                
                {/* Show summary if completed, otherwise show prompt */}
                {step.status === 'completed' && step.summary ? (
                  <div>
                    <h4 className={`text-sm font-medium ${styles.text}`}>
                      {step.summary}
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5 italic">
                      {step.title}
                    </p>
                  </div>
                ) : (
                  <div>
                    <h4 className={`text-sm ${step.status === 'active' ? 'font-medium' : ''} ${styles.text}`}>
                      {step.title}
                    </h4>
                    {step.status === 'active' && step.prompt && (
                      <p className="text-xs text-gray-600 mt-1 italic">
                        "{step.prompt}"
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Icon */}
              <div className={`ml-2 ${styles.icon}`}>
                {step.icon}
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress Bar */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Progress: {currentPhase}/{totalPhases} phases complete
          </span>
        </div>
        <div className="relative">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          {/* Progress segments */}
          <div className="absolute inset-0 flex">
            {Array.from({ length: totalPhases }).map((_, index) => (
              <div
                key={index}
                className="flex-1 border-r border-white last:border-r-0"
                style={{ width: `${100 / totalPhases}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// BeAligned Reflection steps based on the instructions
export const defaultReflectionSteps: Omit<ReflectionStep, 'status' | 'summary'>[] = [
  {
    id: 1,
    label: "LET'S NAME IT",
    title: 'Name the Issue',
    prompt: "What's the situation that's been sticking with you lately?",
    description: 'Invite the user to name one issue that\'s been on their mind.',
    icon: <ChatBubbleLeftRightIcon className="h-4 w-4" />
  },
  {
    id: 2,
    label: "WHAT'S BENEATH THAT?",
    title: 'Explore Feelings',
    prompt: "What feelings come up when you think about this?",
    description: 'Sometimes anger masks hurt or control masks fear. What might be underneath that?',
    icon: <HeartIcon className="h-4 w-4" />
  },
  {
    id: 3,
    label: "YOUR WHY",
    title: 'Identify Purpose',
    prompt: "What is it about this that feels important to you?",
    description: "What are you hoping for — for your child, for yourself, or for the relationship?",
    icon: <LightBulbIcon className="h-4 w-4" />
  },
  {
    id: 4,
    label: "STEP INTO YOUR CO-PARENT'S SHOES",
    title: 'Co-Parent Perspective',
    prompt: "If your co-parent described this, how might they see it?",
    description: "Even if you don\'t agree, what do you imagine they\'re feeling or needing?",
    icon: <UserGroupIcon className="h-4 w-4" />
  },
  {
    id: 5,
    label: "SEE THROUGH YOUR CHILD'S EYES",
    title: 'Child Perspective',
    prompt: "What might your child be noticing about this?",
    description: "How might they be feeling? What might they need right now?",
    icon: <SparklesIcon className="h-4 w-4" />
  },
  {
    id: 6,
    label: "EXPLORE ALIGNED OPTIONS",
    title: 'Generate Solutions',
    prompt: "Given everything we\'ve explored — what ideas come to mind?",
    description: 'Generate 2–3 ideas that honor all three perspectives.',
    icon: <EyeIcon className="h-4 w-4" />
  },
  {
    id: 7,
    label: "CHOOSE + COMMUNICATE",
    title: 'Take Action',
    prompt: "Which of these feels most aligned with everyone\'s needs?",
    description: 'Would you like help crafting a message that reflects shared purpose?',
    icon: <HandRaisedIcon className="h-4 w-4" />
  }
];