'use client';

import { useState, useEffect } from 'react';

// --- DEFINE TOUR STEPS ---
const steps = [
  {
    targetId: 'project-setup',
    title: '1. Create a Project',
    content: 'Welcome! This is where you create new QC reports. Start by scanning a barcode or filling in the details.',
    placement: 'right',
  },
  {
    targetId: 'notification-center',
    title: '2. Check Notifications',
    content: 'You will receive all important updates here, like when a buyer signs a contract or sends you a message.',
    placement: 'bottom',
  },
  {
    targetId: 'town-hall-link',
    title: '3. Explore the Town Hall',
    content: 'This is the marketplace. Here you can find verified suppliers or list your own 100% compliant products for sale.',
    placement: 'bottom',
  },
];

export default function OnboardingTour() {
  const [stepIndex, setStepIndex] = useState(-1); // -1 means tour is not active
  const [position, setPosition] = useState({ top: 0, left: 0 });

  // Start the tour only on the client-side
  useEffect(() => {
    const hasCompletedTour = localStorage.getItem('hasCompletedQCTour');
    if (!hasCompletedTour) {
      setStepIndex(0); // Start with the first step
    }
  }, []);

  // Update tooltip position when step changes
  useEffect(() => {
    if (stepIndex >= 0) {
      const currentStep = steps[stepIndex];
      const targetElement = document.getElementById(currentStep.targetId);
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        
        // Calculate position based on placement
        let top = 0;
        let left = 0;
        if (currentStep.placement === 'right') {
            top = rect.top;
            left = rect.right + 10;
        } else if (currentStep.placement === 'bottom') {
            top = rect.bottom + 10;
            left = rect.left;
        }
        setPosition({ top, left });
        
        // Add a highlight class to the target
        targetElement.classList.add('tour-highlight');
        
        // Cleanup function to remove highlight
        return () => targetElement.classList.remove('tour-highlight');
      }
    }
  }, [stepIndex]);

  const endTour = () => {
    localStorage.setItem('hasCompletedQCTour', 'true');
    setStepIndex(-1);
  };

  const nextStep = () => {
    if (stepIndex < steps.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      endTour();
    }
  };
  
  const prevStep = () => {
    if (stepIndex > 0) {
      setStepIndex(stepIndex - 1);
    }
  };

  if (stepIndex === -1) return null; // Don't render anything if tour is not active

  const currentStep = steps[stepIndex];

  return (
    <>
        {/* Overlay */}
        <div className="fixed inset-0 bg-black/30 z-[998]"></div>
        
        {/* Tooltip */}
        <div 
            className="fixed bg-white rounded-lg shadow-2xl p-4 w-64 z-[999] transition-all"
            style={{ top: `${position.top}px`, left: `${position.left}px` }}
        >
            <h4 className="font-bold text-gray-800 mb-2">{currentStep.title}</h4>
            <p className="text-sm text-gray-600 mb-4">{currentStep.content}</p>

            <div className="flex justify-between items-center">
                <button onClick={endTour} className="text-xs text-gray-400 hover:text-gray-600">Skip</button>
                <div>
                    {stepIndex > 0 && <button onClick={prevStep} className="text-sm px-3 py-1">Back</button>}
                    <button onClick={nextStep} className="bg-indigo-600 text-white font-bold text-sm px-4 py-1.5 rounded-md">
                        {stepIndex === steps.length - 1 ? 'Finish' : 'Next'}
                    </button>
                </div>
            </div>
        </div>
    </>
  );
}