import { motion } from 'motion/react';
import { Bell, Calendar, ExternalLink, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

export function AnnouncementBar() {
  const [isVisible, setIsVisible] = useState(true);

  const announcements = [
    {
      type: "Policy Update",
      title: "New Rainwater Harvesting Mandate",
      description: "All new constructions above 300 sqm must implement rainwater harvesting systems. Effective from April 2024.",
      date: "March 15, 2024",
      priority: "high",
      link: "#policy"
    },
    {
      type: "Event",
      title: "National Water Conservation Week",
      description: "Join workshops and awareness programs across all major cities. Register now for free participation.",
      date: "April 1-7, 2024",
      priority: "medium",
      link: "#events"
    }
  ];

  if (!isVisible) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6 }}
      className="py-16 bg-gradient-to-r from-blue-600 to-blue-800"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center mb-8"
          >
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Bell className="w-6 h-6 text-blue-200" aria-hidden="true" />
              <h2 className="text-2xl md:text-3xl font-bold text-white">
                Latest Announcements
              </h2>
            </div>
            <p className="text-blue-100 max-w-2xl mx-auto m-0">
              Stay updated with the latest policies, events, and initiatives in water conservation
            </p>
          </motion.div>

          {/* Announcements Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {announcements.map((announcement, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                whileHover={{ y: -4, scale: 1.02 }}
                className="group"
              >
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <Badge 
                        className={`${
                          announcement.priority === 'high' 
                            ? 'bg-red-100 text-red-800 border-red-200' 
                            : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                        }`}
                      >
                        {announcement.type}
                      </Badge>
                      {announcement.priority === 'high' && (
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="w-2 h-2 bg-red-400 rounded-full"
                          aria-label="High priority"
                        />
                      )}
                    </div>
                    
                    <div className="flex items-center text-blue-200 text-sm">
                      <Calendar className="w-4 h-4 mr-1" aria-hidden="true" />
                      {announcement.date}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="space-y-3">
                    <h3 className="text-xl font-bold text-white group-hover:text-blue-100 transition-colors">
                      {announcement.title}
                    </h3>
                    <p className="text-blue-100 leading-relaxed m-0">
                      {announcement.description}
                    </p>
                  </div>

                  {/* Action */}
                  <div className="mt-6 flex items-center justify-between">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/10 hover:text-white border-white/20 group-hover:border-white/40 transition-all duration-300"
                    >
                      Read More
                      <ExternalLink className="w-4 h-4 ml-2" aria-hidden="true" />
                    </Button>
                    
                    <motion.div
                      className="w-8 h-1 bg-white/30 rounded-full overflow-hidden"
                      whileHover={{ scale: 1.1 }}
                    >
                      <motion.div
                        className="w-full h-full bg-white rounded-full"
                        initial={{ x: "-100%" }}
                        whileInView={{ x: "0%" }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.5 + index * 0.2 }}
                      />
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Close Button */}
          <button
            onClick={() => setIsVisible(false)}
            className="absolute top-0 right-0 w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Close announcements"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5 pointer-events-none">
            <svg width="100%" height="100%" viewBox="0 0 100 100">
              <defs>
                <pattern id="announcement-pattern" width="20" height="20" patternUnits="userSpaceOnUse">
                  <circle cx="10" cy="10" r="1" fill="white" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#announcement-pattern)" />
            </svg>
          </div>
        </div>
      </div>
    </motion.section>
  );
}