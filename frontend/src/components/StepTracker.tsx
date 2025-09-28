import React from 'react';
import { CheckCircleIcon, CircleStackIcon } from '@heroicons/react/24/solid';
import { ClockIcon } from '@heroicons/react/24/outline';

export interface Step {
  id: number;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
  timestamp?: string;
}

interface StepTrackerProps {
  steps: Step[];
  currentStep: number;
}

export const StepTracker: React.FC<StepTrackerProps> = ({ steps, currentStep }) => {
  const getStepIcon = (step: Step, index: number) => {
    if (step.status === 'completed') {
      return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
    } else if (step.status === 'in-progress') {
      return (
        <div className="relative">
          <CircleStackIcon className="h-6 w-6 text-indigo-600 animate-pulse" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-2 w-2 bg-indigo-600 rounded-full animate-ping"></div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="h-6 w-6 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center">
          <span className="text-xs text-gray-500">{index + 1}</span>
        </div>
      );
    }
  };

  const getStepLineClass = (step: Step) => {
    if (step.status === 'completed') {
      return 'bg-green-500';
    } else if (step.status === 'in-progress') {
      return 'bg-gradient-to-b from-green-500 to-gray-300';
    } else {
      return 'bg-gray-300';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 h-full">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Journey Progress</h3>
        <p className="text-sm text-gray-500 mt-1">
          Step {Math.min(currentStep + 1, steps.length)} of {steps.length}
        </p>
      </div>

      <div className="relative">
        {steps.map((step, index) => (
          <div key={step.id} className="relative flex items-start mb-8 last:mb-0">
            {/* Connecting Line */}
            {index < steps.length - 1 && (
              <div
                className={`absolute left-3 top-8 w-0.5 h-full ${getStepLineClass(steps[index + 1])}`}
              />
            )}

            {/* Step Icon */}
            <div className="relative flex-shrink-0 z-10">
              {getStepIcon(step, index)}
            </div>

            {/* Step Content */}
            <div className="ml-4 flex-1">
              <div
                className={`${
                  step.status === 'completed'
                    ? 'text-gray-900'
                    : step.status === 'in-progress'
                    ? 'text-indigo-600 font-medium'
                    : 'text-gray-400'
                }`}
              >
                <h4 className="text-sm font-medium">{step.title}</h4>
                <p className="text-xs mt-1 opacity-75">{step.description}</p>
              </div>

              {/* Timestamp */}
              {step.timestamp && (
                <div className="flex items-center mt-2 text-xs text-gray-400">
                  <ClockIcon className="h-3 w-3 mr-1" />
                  <span>{step.timestamp}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          <span>Overall Progress</span>
          <span>{Math.round((steps.filter(s => s.status === 'completed').length / steps.length) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-2 rounded-full transition-all duration-500"
            style={{
              width: `${(steps.filter(s => s.status === 'completed').length / steps.length) * 100}%`
            }}
          />
        </div>
      </div>

      {/* Current Action */}
      {steps.find(s => s.status === 'in-progress') && (
        <div className="mt-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
          <div className="flex items-center">
            <div className="animate-pulse h-2 w-2 bg-indigo-600 rounded-full mr-2"></div>
            <span className="text-sm font-medium text-indigo-700">
              Currently: {steps.find(s => s.status === 'in-progress')?.title}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};