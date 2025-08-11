import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit3, Check, X } from "lucide-react";
import type { TestParameter } from "@/hooks/use-editable-ranges";

interface EditableParameterRowProps {
  param: TestParameter;
  currentValue: string;
  onResultChange: (paramName: string, value: string) => void;
  // Range editing
  currentRange: string;
  isEditingRange: boolean;
  onRangeEdit: (paramName: string) => void;
  onRangeChange: (paramName: string, range: string) => void;
  onRangeSave: (paramName: string) => void;
  onRangeCancel: (paramName: string) => void;
  // Flag editing
  flag: string;
  flagColor: string;
  isEditingFlag: boolean;
  onFlagEdit: (paramName: string) => void;
  onFlagChange: (paramName: string, flag: string) => void;
  onFlagSave: (paramName: string) => void;
  onFlagCancel: (paramName: string) => void;
}

export function EditableParameterRow({
  param,
  currentValue,
  onResultChange,
  currentRange,
  isEditingRange,
  onRangeEdit,
  onRangeChange,
  onRangeSave,
  onRangeCancel,
  flag,
  flagColor,
  isEditingFlag,
  onFlagEdit,
  onFlagChange,
  onFlagSave,
  onFlagCancel,
}: EditableParameterRowProps) {
  return (
    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-center">
        {/* Parameter Name */}
        <div className="lg:col-span-1">
          <Label className="text-sm font-medium text-slate-700">
            {param.label}
          </Label>
        </div>
        
        {/* Normal Range */}
        <div className="lg:col-span-1">
          <div className="text-sm text-slate-600 flex items-center gap-2">
            <span className="font-medium">Normal Range:</span>
            {!isEditingRange ? (
              <div className="flex items-center gap-2">
                <span className="text-blue-600 font-semibold">{currentRange} {param.unit}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-slate-500 hover:text-slate-700"
                  onClick={() => onRangeEdit(param.name)}
                  aria-label={`Edit ${param.label} range`}
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  value={currentRange}
                  onChange={(e) => onRangeChange(param.name, e.target.value)}
                  placeholder="min-max"
                  className="h-8 w-28 text-center"
                />
                <span className="text-slate-500">{param.unit}</span>
                <Button
                  type="button"
                  size="icon"
                  className="h-7 w-7 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => onRangeSave(param.name)}
                  aria-label="Save range"
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onRangeCancel(param.name)}
                  aria-label="Cancel range edit"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
        
        {/* Result Input */}
        <div className="lg:col-span-1">
          <div className="flex">
            <Input
              type="number"
              step={param.step}
              value={currentValue}
              onChange={(e) => onResultChange(param.name, e.target.value)}
              className="flex-1 rounded-r-none text-center font-medium"
              placeholder="Enter result"
            />
            <span className="px-3 py-2 bg-white border border-l-0 border-slate-300 rounded-r-lg text-sm text-slate-600 font-medium">
              {param.unit}
            </span>
          </div>
        </div>
        
        {/* Flag Status */}
        <div className="lg:col-span-1">
          <div className="flex items-center gap-2">
            {flag && (
              <div className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${flagColor}`}>
                {flag}
              </div>
            )}
            {!isEditingFlag ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-slate-500 hover:text-slate-700"
                onClick={() => onFlagEdit(param.name)}
                aria-label={`Edit ${param.label} flag`}
              >
                <Edit3 className="h-4 w-4" />
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Select
                  value={flag}
                  onValueChange={(v) => onFlagChange(param.name, v)}
                >
                  <SelectTrigger className="h-8 w-28">
                    <SelectValue placeholder="Flag" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">LOW</SelectItem>
                    <SelectItem value="NORMAL">NORMAL</SelectItem>
                    <SelectItem value="HIGH">HIGH</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  size="icon"
                  className="h-7 w-7 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => onFlagSave(param.name)}
                  aria-label="Save flag"
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onFlagCancel(param.name)}
                  aria-label="Cancel flag edit"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
