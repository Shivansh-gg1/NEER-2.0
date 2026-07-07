import { motion } from 'motion/react';
import { Droplets, Building, Coins, Users, Trophy, Zap, Leaf, Target } from 'lucide-react';

export function StatsBentoGrid() {
  const statsData = [
    {
      icon: Building,
      value: "2.5M+",
      label: "Assessments Completed",
      description: "Properties evaluated nationwide",
      size: "large",
      color: "blue",
      delay: 0.1
    },
    {
      icon: Droplets,
      value: "15,000+",
      label: "Systems Installed",
      description: "Active rainwater harvesting",
      size: "medium",
      color: "green",
      delay: 0.2
    },
    {
      icon: Coins,
      value: "₹50Cr+",
      label: "Water Savings",
      description: "Economic value generated",
      size: "medium",
      color: "orange",
      delay: 0.3
    },
    {
      icon: Trophy,
      value: "Award Winner",
      label: "Digital India 2024",
      description: "Innovation excellence",
      size: "small",
      color: "yellow",
      delay: 0.4
    },
    {
      icon: Leaf,
      value: "Carbon Neutral",
      label: "Environmental Impact",
      description: "Green technology certified",
      size: "small",
      color: "green",
      delay: 0.5
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: "from-blue-500 to-blue-600 text-blue-600 bg-blue-50 border-blue-200",
      green: "from-green-500 to-green-600 text-green-600 bg-green-50 border-green-200",
      orange: "from-orange-500 to-orange-600 text-orange-600 bg-orange-50 border-orange-200",
      purple: "from-purple-500 to-purple-600 text-purple-600 bg-purple-50 border-purple-200",
      yellow: "from-yellow-500 to-yellow-600 text-yellow-600 bg-yellow-50 border-yellow-200"
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'large':
        return 'md:col-span-2 md:row-span-2';
      case 'medium':
        return 'md:col-span-2';
      case 'small':
      default:
        return 'md:col-span-1';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl">
      {statsData.map((stat, index) => {
        const Icon = stat.icon;
        const colorClasses = getColorClasses(stat.color);
        const sizeClasses = getSizeClasses(stat.size);
        
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ 
              duration: 0.5, 
              delay: stat.delay,
              ease: [0.4, 0, 0.2, 1]
            }}
            whileHover={{ 
              scale: 1.02, 
              y: -2,
              transition: { duration: 0.2 }
            }}
            className={`
              ${sizeClasses}
              relative overflow-hidden rounded-2xl border-2 ${colorClasses.split(' ').slice(-2).join(' ')}
              bg-white hover:shadow-lg transition-all duration-300 cursor-pointer
              p-4 md:p-6 group
            `}
          >
            {/* Background gradient overlay */}
            <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses.split(' ').slice(0, 2).join(' ')} opacity-5 group-hover:opacity-10 transition-opacity duration-300`} />
            
            {/* Content */}
            <div className="relative z-10 h-full flex flex-col justify-between">
              {/* Icon */}
              <div className="flex items-start justify-between mb-3">
                <motion.div
                  className={`w-10 h-10 md:w-12 md:h-12 rounded-xl ${colorClasses.split(' ').slice(-3, -1).join(' ')} flex items-center justify-center`}
                  whileHover={{ rotate: 5, scale: 1.1 }}
                  transition={{ duration: 0.2 }}
                >
                  <Icon className={`w-5 h-5 md:w-6 md:h-6 ${colorClasses.split(' ')[2]}`} />
                </motion.div>
              </div>

              {/* Value */}
              <div className="space-y-1 mb-2">
                <motion.div
                  className="text-xl md:text-2xl font-bold text-gray-900"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: stat.delay + 0.2 }}
                >
                  {stat.value}
                </motion.div>
                <div className="font-medium text-gray-800 text-sm md:text-base">
                  {stat.label}
                </div>
              </div>

              {/* Description */}
              <div className="text-xs md:text-sm text-gray-600 leading-relaxed">
                {stat.description}
              </div>

              {/* Animated decoration for large cards */}
              {stat.size === 'large' && (
                <motion.div
                  className={`absolute -bottom-2 -right-2 w-16 h-16 bg-gradient-to-br ${colorClasses.split(' ').slice(0, 2).join(' ')} rounded-full opacity-10`}
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.1, 0.2, 0.1]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}