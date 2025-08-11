import { useState, useEffect } from "react";

export interface TestParameter {
  name: string;
  label: string;
  unit: string;
  normalRange: string;
  step: string;
}

export function useEditableRanges(parameters: TestParameter[]) {
  // Per-parameter overrides and edit modes
  const [rangeOverrides, setRangeOverrides] = useState<Record<string, string>>({});
  const [flagOverrides, setFlagOverrides] = useState<Record<string, string>>({});
  const [editingRange, setEditingRange] = useState<Record<string, boolean>>({});
  const [editingFlag, setEditingFlag] = useState<Record<string, boolean>>({});

  // Initialize default overrides lazily
  useEffect(() => {
    // Populate range overrides with defaults only once
    setRangeOverrides(prev => {
      if (Object.keys(prev).length) return prev;
      const init: Record<string, string> = {};
      parameters.forEach(p => (init[p.name] = p.normalRange));
      return init;
    });
  }, [parameters]);

  // Function to get flag for a parameter
  const getFlag = (paramName: string, value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || !value.trim()) return "";
    
    const param = parameters.find(p => p.name === paramName);
    if (!param) return "";
    
    // Use override range if present
    const rangeStr = rangeOverrides[paramName] ?? param.normalRange;
    
    // Handle special ranges like "<140" or ">5"
    if (rangeStr.startsWith('<')) {
      const max = parseFloat(rangeStr.substring(1));
      const computed = numValue >= max ? "HIGH" : "NORMAL";
      return flagOverrides[paramName] ?? computed;
    }
    
    if (rangeStr.startsWith('>')) {
      const min = parseFloat(rangeStr.substring(1));
      const computed = numValue <= min ? "LOW" : "NORMAL";
      return flagOverrides[paramName] ?? computed;
    }
    
    // Standard range format "min-max"
    const [min, max] = rangeStr.split('-').map(parseFloat);
    if (isNaN(min) || isNaN(max)) return flagOverrides[paramName] ?? "";
    
    const computed = numValue < min ? "LOW" : numValue > max ? "HIGH" : "NORMAL";
    // Use manual override if set
    return flagOverrides[paramName] ?? computed;
  };

  // Function to get flag color
  const getFlagColor = (flag: string) => {
    switch (flag) {
      case "LOW": return "text-red-600 bg-red-50";
      case "HIGH": return "text-red-600 bg-red-50";
      case "NORMAL": return "text-green-600 bg-green-50";
      default: return "text-slate-500 bg-slate-50";
    }
  };

  // Calculate flags for all parameters based on results
  const calculateFlags = (results: Record<string, string>) => {
    const flags: Record<string, string> = {};
    parameters.forEach(param => {
      const value = parseFloat(results[param.name]);
      if (!isNaN(value)) {
        // Manual flag override takes precedence
        const manual = flagOverrides[param.name];
        if (manual) {
          flags[param.name] = manual;
        } else {
          const rangeStr = rangeOverrides[param.name] ?? param.normalRange;
          
          // Handle special ranges like "<140" or ">5"
          if (rangeStr.startsWith('<')) {
            const max = parseFloat(rangeStr.substring(1));
            flags[param.name] = value >= max ? "HIGH" : "NORMAL";
          } else if (rangeStr.startsWith('>')) {
            const min = parseFloat(rangeStr.substring(1));
            flags[param.name] = value <= min ? "LOW" : "NORMAL";
          } else {
            // Standard range format "min-max"
            const [min, max] = rangeStr.split('-').map(parseFloat);
            if (!isNaN(min) && !isNaN(max)) {
              if (value < min) {
                flags[param.name] = "LOW";
              } else if (value > max) {
                flags[param.name] = "HIGH";
              } else {
                flags[param.name] = "NORMAL";
              }
            }
          }
        }
      }
    });
    return flags;
  };

  // Get normal ranges for saving
  const getNormalRanges = () => {
    const normalRanges: Record<string, string> = {};
    parameters.forEach(param => {
      normalRanges[param.name] = rangeOverrides[param.name] ?? param.normalRange;
    });
    return normalRanges;
  };

  return {
    rangeOverrides,
    setRangeOverrides,
    flagOverrides,
    setFlagOverrides,
    editingRange,
    setEditingRange,
    editingFlag,
    setEditingFlag,
    getFlag,
    getFlagColor,
    calculateFlags,
    getNormalRanges,
  };
}
