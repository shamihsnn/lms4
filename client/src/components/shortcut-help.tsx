import { useState, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

export function ShortcutHelp({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="p-4">
          <h2 className="text-2xl font-bold mb-6">Keyboard Shortcuts Guide</h2>
          
          <div className="space-y-6">
            <Section title="Main Navigation">
              <Shortcut keys="H" desc="Home/Dashboard" />
              <Shortcut keys="P" desc="Patients" />
              <Shortcut keys="R" desc="Reports" />
              <Shortcut keys="Alt+T" desc="Enter Test Mode" />
            </Section>

            <Section title="Global Shortcuts (Work Everywhere)">
              <Shortcut keys="Ctrl+S" desc="Save Form/Changes" />
              <Shortcut keys="Ctrl+P" desc="Print Current Report" />
              <Shortcut keys="Ctrl+K" desc="Quick Search" />
              <Shortcut keys="Ctrl+N" desc="New Patient" />
              <Shortcut keys="/" desc="Focus Search" />
              <Shortcut keys="?" desc="Show This Help" />
            </Section>

            <Section title="Test Mode Shortcuts (Press Alt+T first)">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <h4 className="font-medium mb-2">Blood Tests</h4>
                  <Shortcut keys="C" desc="CBC Test" />
                  <Shortcut keys="L" desc="Liver Function" />
                  <Shortcut keys="R" desc="Renal Function" />
                  <Shortcut keys="B" desc="Blood Group" />
                  <Shortcut keys="S" desc="Blood Sugar" />
                </div>
                <div>
                  <h4 className="font-medium mb-2">Special Tests</h4>
                  <Shortcut keys="T" desc="Thyroid" />
                  <Shortcut keys="H" desc="HBsAg" />
                  <Shortcut keys="V" desc="VDRL" />
                  <Shortcut keys="W" desc="Widal" />
                  <Shortcut keys="M" desc="Malaria" />
                </div>
              </div>
              <div className="mt-4">
                <h4 className="font-medium mb-2">Analysis Tests</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Shortcut keys="U" desc="Urine Analysis" />
                  <Shortcut keys="E" desc="Electrolytes" />
                  <Shortcut keys="P" desc="Prolactin" />
                  <Shortcut keys="A" desc="Semen Analysis" />
                  <Shortcut keys="X" desc="Custom Test" />
                </div>
              </div>
            </Section>

            <Section title="Form Navigation">
              <Shortcut keys="Tab" desc="Next Field" />
              <Shortcut keys="Shift+Tab" desc="Previous Field" />
              <Shortcut keys="Enter" desc="Submit Form" />
              <Shortcut keys="Esc" desc="Close Modal/Cancel" />
            </Section>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-3 text-blue-600">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Shortcut({ keys, desc }: { keys: string; desc: string }) {
  return (
    <div className="flex items-center gap-2">
      <kbd className="px-2 py-1 bg-slate-100 rounded text-sm font-mono">{keys}</kbd>
      <span className="text-slate-600">- {desc}</span>
    </div>
  );
}
