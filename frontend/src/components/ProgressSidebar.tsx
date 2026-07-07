import { MapPin, Home, BarChart3 } from 'lucide-react';
import { cn } from './ui/utils'; // Assuming you have a utility file for classnames

interface ProgressSidebarProps {
  currentStep: number;
  completedSteps: number[];
  onStepClick: (step: number) => void;
}

export function ProgressSidebar({ currentStep, completedSteps, onStepClick }: ProgressSidebarProps) {
  const steps = [
    { id: 1, title: 'Location', icon: MapPin },
    { id: 2, title: 'Property Details', icon: Home },
    { id: 3, title: 'Results', icon: BarChart3 },
  ];

  return (
    <aside 
      className="hidden lg:block w-80 bg-slate-50 border-r border-gray-200 min-h-screen p-6"
      aria-label="Assessment progress"
    >
      <h2 className="text-2xl font-bold text-blue-900 mb-8">Assessment Progress</h2>
      
      <nav className="space-y-4" role="navigation" aria-label="Assessment steps">
        {steps.map((step) => {
          const Icon = step.icon;
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = currentStep === step.id;
          const isClickable = isCompleted || isCurrent;
          
          return (
            <button
              key={step.id}
              onClick={() => isClickable && onStepClick(step.id)}
              disabled={!isClickable}
              className={cn(
                "w-full flex items-center space-x-4 p-4 rounded-lg text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
                isCurrent && "bg-blue-100 border-2 border-blue-300",
                isCompleted && !isCurrent && "bg-green-50 border border-green-200 hover:bg-green-100",
                !isCompleted && !isCurrent && "bg-gray-100 cursor-not-allowed opacity-60"
              )}
              aria-current={isCurrent ? "step" : undefined}
            >
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                isCurrent && "bg-blue-600 text-white",
                isCompleted && !isCurrent && "bg-green-600 text-white",
                !isCompleted && !isCurrent && "bg-gray-300 text-gray-600"
              )}>
                <Icon className="w-5 h-5" aria-hidden="true" />
              </div>
              
              <div className="flex-1">
                <span className={cn(
                  "font-medium",
                  isCurrent && "text-blue-900",
                  isCompleted && !isCurrent && "text-green-900",
                  !isCompleted && !isCurrent && "text-gray-700"
                )}>
                  {step.title}
                </span>
                <p className="text-sm text-gray-600 m-0">
                  Step {step.id} of {steps.length}
                </p>
              </div>
            </button>
          );
        })}
      </nav>
      
      <div className="mt-auto p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-bold text-blue-900 mb-2">Need Help?</h3>
        <p className="text-sm text-blue-800 m-0 mb-3">
          Contact our support team for assistance with your assessment.
        </p>
        <a 
          href="tel:1800-xxx-xxxx" 
          className="text-sm font-semibold text-blue-600 hover:text-blue-800 underline"
        >
          1800-XXX-XXXX
        </a>
      </div>
    </aside>
  );
}