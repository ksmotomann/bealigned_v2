import { useState, useCallback } from 'react';

export interface ReflectionData {
  // Phase 1: Issue Naming
  issue: string;

  // Phase 2: Feelings Exploration
  surfaceFeelings: string[];
  deeperFeelings: string[];
  feelingsInsight: string;

  // Phase 3: Your Why
  yourWhy: string;
  deeperValues: string[];

  // Phase 4: Co-Parent Perspective
  coParentView: string;
  coParentFeelings: string[];
  coParentWhy: string;

  // Phase 5: Child's Perspective
  childObservation: string;
  childFeelings: string[];
  childNeeds: string[];
  childHopes: string;

  // Phase 6: Aligned Options
  alignedOptions: string[];
  selectedOption: string;

  // Phase 7: CLEAR Message
  messageDraft: string;
  finalMessage: string;

  // Meta
  completedPhases: number[];
  currentPhase: number;
  startedAt: Date;
  completedAt?: Date;
}

const initialReflectionData: ReflectionData = {
  issue: '',
  surfaceFeelings: [],
  deeperFeelings: [],
  feelingsInsight: '',
  yourWhy: '',
  deeperValues: [],
  coParentView: '',
  coParentFeelings: [],
  coParentWhy: '',
  childObservation: '',
  childFeelings: [],
  childNeeds: [],
  childHopes: '',
  alignedOptions: [],
  selectedOption: '',
  messageDraft: '',
  finalMessage: '',
  completedPhases: [],
  currentPhase: 1,
  startedAt: new Date()
};

export const useReflectionState = () => {
  const [reflection, setReflection] = useState<ReflectionData>(initialReflectionData);

  const updateReflection = useCallback((updates: Partial<ReflectionData>) => {
    setReflection(prev => ({
      ...prev,
      ...updates
    }));
  }, []);

  const updatePhaseData = useCallback((phase: number, data: Partial<ReflectionData>) => {
    setReflection(prev => {
      const updatedCompletedPhases = prev.completedPhases.includes(phase)
        ? prev.completedPhases
        : [...prev.completedPhases, phase].sort();

      return {
        ...prev,
        ...data,
        completedPhases: updatedCompletedPhases,
        currentPhase: phase + 1 <= 7 ? phase + 1 : 7
      };
    });
  }, []);

  const addFeeling = useCallback((feeling: string, type: 'surface' | 'deeper') => {
    setReflection(prev => {
      const fieldName = type === 'surface' ? 'surfaceFeelings' : 'deeperFeelings';
      const currentFeelings = prev[fieldName];

      if (currentFeelings.includes(feeling)) {
        return {
          ...prev,
          [fieldName]: currentFeelings.filter(f => f !== feeling)
        };
      } else {
        return {
          ...prev,
          [fieldName]: [...currentFeelings, feeling]
        };
      }
    });
  }, []);

  const addValue = useCallback((value: string) => {
    setReflection(prev => {
      if (prev.deeperValues.includes(value)) {
        return {
          ...prev,
          deeperValues: prev.deeperValues.filter(v => v !== value)
        };
      } else {
        return {
          ...prev,
          deeperValues: [...prev.deeperValues, value]
        };
      }
    });
  }, []);

  const addChildNeed = useCallback((need: string) => {
    setReflection(prev => {
      if (prev.childNeeds.includes(need)) {
        return {
          ...prev,
          childNeeds: prev.childNeeds.filter(n => n !== need)
        };
      } else {
        return {
          ...prev,
          childNeeds: [...prev.childNeeds, need]
        };
      }
    });
  }, []);

  const addAlignedOption = useCallback((option: string) => {
    setReflection(prev => ({
      ...prev,
      alignedOptions: [...prev.alignedOptions, option]
    }));
  }, []);

  const removeAlignedOption = useCallback((index: number) => {
    setReflection(prev => ({
      ...prev,
      alignedOptions: prev.alignedOptions.filter((_, i) => i !== index)
    }));
  }, []);

  const selectOption = useCallback((option: string) => {
    setReflection(prev => ({
      ...prev,
      selectedOption: option
    }));
  }, []);

  const resetReflection = useCallback(() => {
    setReflection({
      ...initialReflectionData,
      startedAt: new Date()
    });
  }, []);

  const completeReflection = useCallback(() => {
    setReflection(prev => ({
      ...prev,
      completedAt: new Date(),
      completedPhases: [1, 2, 3, 4, 5, 6, 7]
    }));
  }, []);

  const goToPhase = useCallback((phase: number) => {
    if (phase >= 1 && phase <= 7) {
      setReflection(prev => ({
        ...prev,
        currentPhase: phase
      }));
    }
  }, []);

  const isPhaseComplete = useCallback((phase: number) => {
    return reflection.completedPhases.includes(phase);
  }, [reflection.completedPhases]);

  const getProgressPercentage = useCallback(() => {
    return (reflection.completedPhases.length / 7) * 100;
  }, [reflection.completedPhases]);

  return {
    reflection,
    updateReflection,
    updatePhaseData,
    addFeeling,
    addValue,
    addChildNeed,
    addAlignedOption,
    removeAlignedOption,
    selectOption,
    resetReflection,
    completeReflection,
    goToPhase,
    isPhaseComplete,
    getProgressPercentage
  };
};