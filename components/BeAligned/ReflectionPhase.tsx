import React from 'react';
import { ReflectionData } from '../hooks/useReflectionState';
import { Phase1IssueNaming } from './phases/Phase1IssueNaming';
import { Phase2FeelingsExploration } from './phases/Phase2FeelingsExploration';
import { Phase3YourWhy } from './phases/Phase3YourWhy';
import { Phase4CoParentPerspective } from './phases/Phase4CoParentPerspective';
import { Phase5ChildPerspective } from './phases/Phase5ChildPerspective';
import { Phase6AlignedOptions } from './phases/Phase6AlignedOptions';
import { Phase7ClearMessage } from './phases/Phase7ClearMessage';

export interface ReflectionPhaseProps {
  phase: number;
  reflection: ReflectionData;
  onComplete: (phaseData: Partial<ReflectionData>) => void;
}

export const ReflectionPhase: React.FC<ReflectionPhaseProps> = ({
  phase,
  reflection,
  onComplete,
}) => {
  const renderPhase = () => {
    switch (phase) {
      case 1:
        return (
          <Phase1IssueNaming
            reflection={reflection}
            onComplete={onComplete}
          />
        );
      case 2:
        return (
          <Phase2FeelingsExploration
            reflection={reflection}
            onComplete={onComplete}
          />
        );
      case 3:
        return (
          <Phase3YourWhy
            reflection={reflection}
            onComplete={onComplete}
          />
        );
      case 4:
        return (
          <Phase4CoParentPerspective
            reflection={reflection}
            onComplete={onComplete}
          />
        );
      case 5:
        return (
          <Phase5ChildPerspective
            reflection={reflection}
            onComplete={onComplete}
          />
        );
      case 6:
        return (
          <Phase6AlignedOptions
            reflection={reflection}
            onComplete={onComplete}
          />
        );
      case 7:
        return (
          <Phase7ClearMessage
            reflection={reflection}
            onComplete={onComplete}
          />
        );
      default:
        return null;
    }
  };

  return renderPhase();
};