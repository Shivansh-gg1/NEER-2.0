import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Globe, Menu, X, User, LogIn } from 'lucide-react';
import { Button } from './ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

interface LandingNavigationProps {
  language: string;
  setLanguage: (language: string) => void;
}

export function LandingNavigation({ language, setLanguage }: LandingNavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '#home', label: 'Home' },
    { href: '#services', label: 'Services' },
    { href: '#reports', label: 'Reports' },
    { href: '#help', label: 'Help' },
    { href: '#about', label: 'About' },
  ];

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-[#006599] shadow-lg backdrop-blur-sm' 
          : 'bg-[#006599]'
      }`}
      style={{ backgroundColor: '#006599' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <motion.div 
            className="flex items-center space-x-3"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-md flex items-center justify-center">
                <span className="text-white font-bold text-sm">N</span>
              </div>
            </div>
            <div className="text-white">
              <div className="font-bold text-lg">NEER</div>
              <div className="text-xs text-blue-100 hidden sm:block">Government of India</div>
            </div>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link, index) => (
              <motion.a
                key={link.href}
                href={link.href}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="text-white hover:text-blue-100 transition-colors duration-200 font-medium text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-600 rounded px-2 py-1"
                whileHover={{ y: -1 }}
              >
                {link.label}
              </motion.a>
            ))}
          </div>

          {/* Right side - Language and Auth */}
          <div className="flex items-center space-x-4">
            {/* Language Toggle */}
            <div className="hidden sm:flex items-center space-x-2">
              <Globe className="w-4 h-4 text-blue-100" aria-hidden="true" />
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-24 bg-white/10 border-white/20 text-white hover:bg-white/20 focus:ring-white" aria-label="Select language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">EN</SelectItem>
                  <SelectItem value="hi">हि</SelectItem>
                  <SelectItem value="te">తె</SelectItem>
                  <SelectItem value="ta">த</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="sm"
                className="text-white hover:bg-white/10 hover:text-white border-white/20"
              >
                <LogIn className="w-4 h-4 mr-2" aria-hidden="true" />
                Login
              </Button>
              <Button 
                size="sm"
                className="bg-white text-blue-600 hover:bg-blue-50"
              >
                <User className="w-4 h-4 mr-2" aria-hidden="true" />
                Sign Up
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-white hover:bg-white/10 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? (
                <X className="w-5 h-5" aria-hidden="true" />
              ) : (
                <Menu className="w-5 h-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <motion.div
          initial={false}
          animate={{ height: isMenuOpen ? 'auto' : 0, opacity: isMenuOpen ? 1 : 0 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="md:hidden overflow-hidden bg-blue-700"
        >
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="block px-3 py-2 text-white hover:bg-white/10 rounded-md font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="border-t border-white/20 pt-3 mt-3 space-y-2">
              <Button 
                variant="ghost" 
                size="sm"
                className="w-full justify-start text-white hover:bg-white/10"
              >
                <LogIn className="w-4 h-4 mr-2" aria-hidden="true" />
                Login
              </Button>
              <Button 
                size="sm"
                className="w-full bg-white text-blue-600 hover:bg-blue-50"
              >
                <User className="w-4 h-4 mr-2" aria-hidden="true" />
                Sign Up
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.nav>
  );
}