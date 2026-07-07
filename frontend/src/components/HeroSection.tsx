import { motion } from 'motion/react';
import { Play, ArrowRight, Shield, Award } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { StatsBentoGrid } from './StatsBentoGrid';

interface HeroSectionProps {
  onStartAssessment: () => void;
}

export function HeroSection({ onStartAssessment }: HeroSectionProps) {
  // Animated water droplet SVG component
  const AnimatedWaterDroplet = () => (
    <motion.svg
      width="400"
      height="400"
      viewBox="0 0 400 400"
      className="absolute top-20 right-10 opacity-10 pointer-events-none"
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
    >
      <motion.path
        d="M200 50 C150 120 100 180 100 240 C100 290 145 340 200 340 C255 340 300 290 300 240 C300 180 250 120 200 50 Z"
        fill="url(#waterGradient)"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 2, delay: 0.5 }}
      />
      <defs>
        <linearGradient id="waterGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#1e40af" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      <motion.circle
        cx="200"
        cy="200"
        r="3"
        fill="#60a5fa"
        animate={{
          y: [0, 20, 0],
          opacity: [0.7, 1, 0.7]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </motion.svg>
  );



  return (
    <section id="home" className="relative bg-gradient-to-br from-blue-50 via-white to-green-50 py-20 overflow-hidden">
      <AnimatedWaterDroplet />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div className="space-y-8">
            {/* Official Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex items-center space-x-4"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
                <Shield className="w-8 h-8 text-white" aria-hidden="true" />
              </div>
              <div>
                <Badge className="bg-green-100 text-green-800 border-green-200 mb-1">
                  <Award className="w-3 h-3 mr-1" aria-hidden="true" />
                  Government Initiative
                </Badge>
                <p className="text-sm text-gray-600 m-0">Ministry of Jal Shakti, Govt. of India</p>
              </div>
            </motion.div>

            {/* Main Heading */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="space-y-4"
            >
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight">
                <span className="text-blue-600">NEER</span>
                <br />
                <span className="text-2xl md:text-3xl font-medium text-gray-700">
                  Next-gen Evaluation for
                  <br />
                  Environmental Recharge
                </span>
              </h1>
              
              <motion.p 
                className="text-xl text-gray-600 max-w-lg m-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                Empowering India's Rooftop Rainwater Harvesting through intelligent assessment and sustainable water management solutions.
              </motion.p>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                <Button
                  onClick={onStartAssessment}
                  size="lg"
                  className="h-14 px-8 bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Start Assessment
                  <ArrowRight className="w-5 h-5 ml-2" aria-hidden="true" />
                </Button>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                <Button
                  variant="outline"
                  size="lg"
                  className="h-14 px-8 border-2 border-gray-300 hover:border-blue-300 hover:bg-blue-50 transition-all duration-300"
                >
                  <Play className="w-5 h-5 mr-2" aria-hidden="true" />
                  Learn More
                </Button>
              </motion.div>
            </motion.div>


          </div>

          {/* Right Column - Stats Bento Grid */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative"
          >
            <StatsBentoGrid />
          </motion.div>
        </div>
      </div>
    </section>
  );
}