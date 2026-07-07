import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';

const banners = [
  {
    id: 1,
    title: "Jal Jeevan Mission 2024",
    subtitle: "Every Drop Counts - Join India's Water Conservation Revolution",
    description: "Government initiative to provide functional household tap connections to all rural households by 2024.",
    image: "/api/placeholder/1200/600",
    cta: "Learn More",
    bgColor: "from-blue-600 to-blue-800"
  },
  {
    id: 2,
    title: "Smart Water Management",
    subtitle: "Technology-Driven Solutions for Sustainable Future",
    description: "Advanced IoT and AI-powered systems for efficient rainwater harvesting and water resource management.",
    image: "/api/placeholder/1200/600",
    cta: "Explore Tech",
    bgColor: "from-green-600 to-green-800"
  },
  {
    id: 3,
    title: "Community Impact",
    subtitle: "Building Resilient Communities Through Water Security",
    description: "Success stories from across India showcasing the transformation through rainwater harvesting initiatives.",
    image: "/api/placeholder/1200/600",
    cta: "View Stories",
    bgColor: "from-purple-600 to-purple-800"
  }
];

export function BannerCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <section 
      className="relative w-full h-[500px] md:h-[600px] overflow-hidden bg-gray-900"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
      aria-label="Featured announcements carousel"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -300 }}
          transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
          className={`absolute inset-0 bg-gradient-to-r ${banners[currentSlide].bgColor}`}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <svg width="100%" height="100%" viewBox="0 0 100 100" className="w-full h-full">
              <defs>
                <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          <div className="relative max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-full">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full">
                {/* Content */}
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="text-white space-y-6"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                  >
                    <h2 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
                      {banners[currentSlide].title}
                    </h2>
                    <h3 className="text-xl md:text-2xl text-blue-100 mb-4 font-medium">
                      {banners[currentSlide].subtitle}
                    </h3>
                  </motion.div>
                  
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="text-lg text-blue-50 max-w-lg leading-relaxed m-0"
                  >
                    {banners[currentSlide].description}
                  </motion.p>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      size="lg"
                      className="bg-white text-blue-600 hover:bg-blue-50 h-12 px-8 font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      {banners[currentSlide].cta}
                    </Button>
                  </motion.div>
                </motion.div>

                {/* Visual Element */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="hidden lg:block"
                >
                  <div className="relative">
                    <div className="w-full h-80 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20 flex items-center justify-center">
                      <div className="text-center text-white/70">
                        <div className="w-16 h-16 bg-white/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                          <svg width="32" height="32" viewBox="0 0 32 32" fill="currentColor">
                            <path d="M16 2l-4 8h-8l6.5 4.7L8 22l8-5.8L24 22l-2.5-7.3L28 10h-8L16 2z"/>
                          </svg>
                        </div>
                        <p className="text-sm">Featured Content</p>
                      </div>
                    </div>
                    
                    {/* Floating elements */}
                    <motion.div
                      className="absolute -top-4 -right-4 w-8 h-8 bg-white/20 rounded-full"
                      animate={{
                        y: [-10, 10, -10],
                        opacity: [0.5, 1, 0.5]
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                    <motion.div
                      className="absolute -bottom-4 -left-4 w-6 h-6 bg-white/20 rounded-full"
                      animate={{
                        y: [10, -10, 10],
                        opacity: [0.3, 0.8, 0.3]
                      }}
                      transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 0.5
                      }}
                    />
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        aria-label="Next slide"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Dot Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-3">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
              index === currentSlide
                ? 'bg-white scale-125'
                : 'bg-white/50 hover:bg-white/70'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
        <motion.div
          className="h-full bg-white"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 5, ease: "linear" }}
          key={currentSlide}
        />
      </div>
    </section>
  );
}