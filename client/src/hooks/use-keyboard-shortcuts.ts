import { useEffect, useCallback, useState } from 'react';
import { useLocation } from 'wouter';
import { useToast } from './use-toast';

const TOAST_DURATION = 3000; // 3 seconds for regular toasts
const HELP_TOAST_DURATION = 15000; // 15 seconds for help toast

export function useKeyboardShortcuts() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isAltMode, setIsAltMode] = useState(false);
  const [altModeTimer, setAltModeTimer] = useState<number | null>(null);

  // Function to handle navigation with feedback
  const navigateTo = useCallback((path: string, pageName: string) => {
    setLocation(path);
    toast({
      title: `Navigated to ${pageName}`,
      description: "Use '?' key to see all shortcuts",
      duration: TOAST_DURATION,
    });
  }, [setLocation, toast]);

  // Handle printing the current report
  const handlePrintShortcut = useCallback((event?: KeyboardEvent) => {
    event?.preventDefault(); // Prevent browser's print dialog

    const tryToPrint = () => {
      // Try to find the print button
      const printButton = document.querySelector(
        [
          '[aria-label="Print Report"]',
          '[aria-label="Print"]',
          'button:contains("Print")',
          'button[title*="Print"]',
          'button > svg[title*="Print"]',
          'button[type="button"]:contains("Print")',
          'button.print-button',
          '#print-button',
          '[data-testid="print-button"]'
        ].join(',')
      ) as HTMLButtonElement;

      if (printButton) {
        printButton.click();
        return true;
      }
      return false;
    };

    const selectFirstReport = () => {
      // Try to find and click the first report in the list
      const firstReport = document.querySelector(
        [
          'tr[role="row"]',
          '.report-row',
          '[data-testid="report-row"]',
          '.report-item',
          'tr.cursor-pointer'
        ].join(',')
      ) as HTMLElement;

      if (firstReport) {
        firstReport.click();
        return true;
      }
      return false;
    };

    const path = window.location.pathname;
    if (!path.includes('/reports')) {
      // If not on reports page, navigate there first
      setLocation('/reports');
      setTimeout(() => {
        // After navigation, try to select first report
        setTimeout(() => {
          if (selectFirstReport()) {
            // After selecting report, try to print
            setTimeout(() => {
              if (tryToPrint()) {
                toast({
                  title: 'Printing first report',
                  description: "Use '?' key to see all shortcuts",
                  duration: TOAST_DURATION,
                });
              }
            }, 100);
          }
        }, 100);
      }, 100);
      
      toast({
        title: 'Navigating to reports...',
        description: "Attempting to print first report",
        duration: TOAST_DURATION,
      });
    } else {
      // Already on reports page
      if (!tryToPrint()) {
        // If no print button, try to select first report
        if (selectFirstReport()) {
          setTimeout(() => {
            if (tryToPrint()) {
              toast({
                title: 'Printing first report',
                description: "Use '?' key to see all shortcuts",
                duration: TOAST_DURATION,
              });
            }
          }, 100);
        } else {
          toast({
            title: 'No reports found',
            description: "Please make sure there are reports available",
            duration: TOAST_DURATION,
          });
        }
      } else {
        toast({
          title: 'Printing report',
          description: "Use '?' key to see all shortcuts",
          duration: TOAST_DURATION,
        });
      }
    }
  }, [toast, setLocation]);

  // Handle quick search activation
  const handleSearchShortcut = useCallback(() => {
    const searchInput = document.querySelector('[aria-label="Search"]') as HTMLInputElement;
    if (searchInput) {
      searchInput.focus();
      toast({
        title: 'Search activated',
        description: "Use '?' key to see all shortcuts",
        duration: TOAST_DURATION,
      });
    }
  }, [toast]);

  // Handle quick patient registration
  const handleQuickPatientReg = useCallback(() => {
    setLocation('/patients');
    setTimeout(() => {
      const nameInput = document.querySelector('input[name="name"]') as HTMLInputElement;
      if (nameInput) {
        nameInput.focus();
        toast({
          title: 'Quick patient registration',
          description: "Use '?' key to see all shortcuts",
          duration: TOAST_DURATION,
        });
      }
    }, 100);
  }, [setLocation, toast]);

  const showShortcutToast = useCallback((action: string) => {
    toast({
      title: action,
      description: "Use '?' key to see all shortcuts",
      duration: 2000,
    });
  }, [toast]);

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    const key = event.key.toLowerCase();

    // Toggle Alt Mode with Escape
    if (event.key === 'Escape') {
      event.preventDefault();
      setIsAltMode(false);
      if (altModeTimer) clearTimeout(altModeTimer);
      showShortcutToast('Test Selection Mode - Deactivated');
      return;
    }

    // Global shortcuts (work even in input fields)
    if (event.ctrlKey) {
      switch (key) {
        case 's': // Save
          event.preventDefault();
          const submitButton = document.querySelector('form button[type="submit"]') as HTMLButtonElement;
          if (submitButton) {
            submitButton.click();
            showShortcutToast('Saving form...');
          }
          return;
        case 'p': // Print
          event.preventDefault();
          handlePrintShortcut();
          return;
        case 'k': // Search
          event.preventDefault();
          handleSearchShortcut();
          return;
        case 'n': // New Patient
          event.preventDefault();
          handleQuickPatientReg();
          return;
      }
      return;
    }

    // Only proceed with non-control shortcuts if not in an input field
    if (
      document.activeElement instanceof HTMLInputElement ||
      document.activeElement instanceof HTMLTextAreaElement
    ) {
      return;
    }

    // Handle test mode shortcuts with Alt key
    if (event.altKey) {
      event.preventDefault(); // Prevent any default Alt key behaviors
      switch (key) {
        // Most Common Tests (Alt + 1-9)
        case '1': navigateTo('/tests/cbc', 'CBC Test'); break;
        case '2': navigateTo('/tests/lft', 'Liver Function Test'); break;
        case '3': navigateTo('/tests/rft', 'Renal Function Test'); break;
        case '4': navigateTo('/tests/sugar', 'Blood Sugar'); break;
        case '5': navigateTo('/tests/thyroid', 'Thyroid Test'); break;
        case '6': navigateTo('/tests/urine', 'Urine Analysis'); break;
        case '7': navigateTo('/tests/blood-group', 'Blood Group'); break;
        case '8': navigateTo('/tests/hbsag', 'HBsAg Test'); break;
        case '9': navigateTo('/tests/widal', 'Widal Test'); break;

        // Additional Tests (Alt + Letter)
        // Row 1: Q to P
        case 'q': navigateTo('/tests/cardiac', 'Cardiac Test'); break;
        case 'w': navigateTo('/tests/electrolytes', 'Electrolytes'); break;
        case 'e': navigateTo('/tests/creatinine', 'Creatinine'); break;
        case 'r': navigateTo('/tests/crp', 'CRP Test'); break;
        case 't': navigateTo('/tests/typhidot', 'Typhidot Test'); break;
        case 'y': navigateTo('/tests/lipid', 'Lipid Profile'); break;
        case 'u': navigateTo('/tests/ra-factor', 'RA Factor'); break;
        case 'i': navigateTo('/tests/ict-malaria', 'ICT Malaria'); break;
        case 'o': navigateTo('/tests/prolactin', 'Prolactin'); break;
        case 'p': navigateTo('/tests/testosterone', 'Testosterone'); break;

        // Row 2: A to L
        case 'a': navigateTo('/tests/semen-analysis', 'Semen Analysis'); break;
        case 's': navigateTo('/tests/stool-re', 'Stool RE'); break;
        case 'd': navigateTo('/tests/stool-occult-blood', 'Stool Occult Blood'); break;
        case 'f': navigateTo('/tests/coagulation', 'Coagulation Profile'); break;
        case 'g': navigateTo('/tests/bilirubin', 'Bilirubin'); break;
        case 'h': navigateTo('/tests/hcv', 'HCV Test'); break;
        case 'j': navigateTo('/tests/hiv', 'HIV Test'); break;
        case 'k': navigateTo('/tests/lh', 'LH Test'); break;
        case 'l': navigateTo('/tests/vdrl', 'VDRL Test'); break;

        // Extra Test
        case 'x': navigateTo('/tests/custom-builder', 'Custom Test'); break;
      }
      return;
    }

    // Regular shortcuts (no Alt key)
    switch (key) {
      // Main Navigation
      case 'h': navigateTo('/dashboard', 'Dashboard (Home)'); break;
      case 'p': navigateTo('/patients', 'Patients'); break;
      case 'r': navigateTo('/reports', 'Reports'); break;
      case 'z': setIsAltMode(true); showShortcutToast('Test Selection Mode - Active for 2 seconds'); break;

      // Quick Actions
      case '/': handleSearchShortcut(); break;
      case 'n': handleQuickPatientReg(); break;
      case '?': showHelpToast(); break;

      // Form Navigation
      case 'tab': 
        if (event.shiftKey) {
          // Focus previous input
          const prevInput = document.querySelector('input:focus')?.previousElementSibling as HTMLElement;
          if (prevInput) prevInput.focus();
        } else {
          // Focus next input
          const nextInput = document.querySelector('input:focus')?.nextElementSibling as HTMLElement;
          if (nextInput) nextInput.focus();
        }
        break;

      // Main Navigation
      case 'd': navigateTo('/dashboard', 'Dashboard'); break;
      case 'p': navigateTo('/patients', 'Patients'); break;
      case 'r': navigateTo('/reports', 'Reports'); break;

      // Test Navigation
      case 'c': navigateTo('/tests/cbc', 'CBC Test'); break;
      case 'l': navigateTo('/tests/lft', 'LFT Test'); break;
      case 't': navigateTo('/tests/thyroid', 'Thyroid Test'); break;
      case 'u': navigateTo('/tests/urine', 'Urine Analysis'); break;
      case 'b': navigateTo('/tests/blood-group', 'Blood Group Test'); break;

      // Quick Actions
      case 's': { // Save functionality
        const saveButton = document.querySelector('button[type="submit"], button:contains("Save")') as HTMLButtonElement;
        if (saveButton) {
          saveButton.click();
          showShortcutToast('Saving...');
        }
        break;
      }
      case '/': handleSearchShortcut(); break;

      // Help System
      case '?': showHelpToast(); break;
    }
  }, [setLocation, toast, altModeTimer, navigateTo, handlePrintShortcut, handleSearchShortcut, handleQuickPatientReg, showShortcutToast]);

  const showHelpToast = useCallback(() => {
    toast({
      title: "Keyboard Shortcuts Help",
      description: `
        Test Selection Mode:
        Z - Enter Test Selection Mode
        Esc - Exit Test Selection Mode

        Most Common Tests (Alt + Number):
        Alt+1 - CBC Test
        Alt+2 - Liver Function Test
        Alt+3 - Renal Function Test
        Alt+4 - Blood Sugar
        Alt+5 - Thyroid Test
        Alt+6 - Urine Analysis
        Alt+7 - Blood Group
        Alt+8 - HBsAg Test
        Alt+9 - Widal Test

        Additional Tests (Alt + Top Row):
        Alt+Q - Cardiac Test
        Alt+W - Electrolytes
        Alt+E - Creatinine
        Alt+R - CRP Test
        Alt+T - Typhidot Test
        Alt+Y - Lipid Profile
        Alt+U - RA Factor
        Alt+I - ICT Malaria
        Alt+O - Prolactin
        Alt+P - Testosterone

        More Tests (Alt + Home Row):
        Alt+A - Semen Analysis
        Alt+S - Stool RE
        Alt+D - Stool Occult Blood
        Alt+F - Coagulation Profile
        Alt+G - Bilirubin
        Alt+H - HCV Test
        Alt+J - HIV Test
        Alt+K - LH Test
        Alt+L - VDRL Test

        Other:
        Alt+X - Custom Test Builder

        Navigation:
        D - Dashboard
        P - Patients
        R - Reports

        Quick Actions:
        Ctrl+P - Print Report
        Ctrl+S - Save Changes
        Ctrl+N - New Patient
        / - Quick Search
        ? - Show This Help
      `,
      duration: HELP_TOAST_DURATION,
    });
  }, [toast]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);
}
