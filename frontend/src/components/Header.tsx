import { Globe, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

interface HeaderProps {
  language: string;
  setLanguage: (language: string) => void;
  onBackToLanding?: () => void;
}

export function Header({ language, setLanguage, onBackToLanding }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-4 lg:px-6">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-4">
          {onBackToLanding && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBackToLanding}
              className="text-blue-600 hover:text-blue-800"
            >
              <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
              Back to Home
            </Button>
          )}
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
            <span className="text-white font-bold text-sm">N</span>
          </div>
          <div>
            <h1 className="text-blue-900 m-0">NEER Assessment</h1>
            <p className="text-gray-600 text-sm m-0">Government of India Initiative</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Globe className="w-4 h-4 text-gray-500" aria-hidden="true" />
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-32 bg-white" aria-label="Select language">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="hi">हिंदी</SelectItem>
              <SelectItem value="te">తెలుగు</SelectItem>
              <SelectItem value="ta">தமிழ்</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </header>
  );
}