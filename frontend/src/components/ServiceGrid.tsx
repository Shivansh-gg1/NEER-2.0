import { motion } from 'motion/react';
import { 
  CheckCircle, 
  Calculator, 
  Map, 
  IndianRupee, 
  MapPin, 
  FileText, 
  Users, 
  Smartphone 
} from 'lucide-react';
import { Card, CardContent } from './ui/card';

const services = [
  {
    icon: CheckCircle,
    title: "Feasibility Check",
    description: "Comprehensive assessment of your property's rainwater harvesting potential",
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200"
  },
  {
    icon: Calculator,
    title: "Water Calculator",
    description: "Calculate potential water collection and savings for your specific property",
    color: "from-green-500 to-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200"
  },
  {
    icon: Map,
    title: "Roof Mapping",
    description: "AI-powered roof area detection and optimization recommendations",
    color: "from-purple-500 to-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200"
  },
  {
    icon: IndianRupee,
    title: "Subsidy Check",
    description: "Check eligibility for government subsidies and financial incentives",
    color: "from-orange-500 to-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200"
  },
  {
    icon: MapPin,
    title: "Map Insights",
    description: "Localized rainfall data and groundwater insights for your area",
    color: "from-teal-500 to-teal-600",
    bgColor: "bg-teal-50",
    borderColor: "border-teal-200"
  },
  {
    icon: FileText,
    title: "Reports",
    description: "Detailed assessment reports and implementation guidelines",
    color: "from-red-500 to-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200"
  },
  {
    icon: Users,
    title: "Expert Support",
    description: "Connect with certified professionals for installation and maintenance",
    color: "from-indigo-500 to-indigo-600",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200"
  },
  {
    icon: Smartphone,
    title: "Mobile App",
    description: "Download our mobile app for on-the-go assessments and monitoring",
    color: "from-pink-500 to-pink-600",
    bgColor: "bg-pink-50",
    borderColor: "border-pink-200"
  }
];

export function ServiceGrid() {
  return (
    <section id="services" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Comprehensive Water Solutions
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto m-0">
            From initial assessment to implementation, we provide end-to-end support for your rainwater harvesting journey
          </p>
        </motion.div>

        {/* Service Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => {
            const Icon = service.icon;
            
            return (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ 
                  duration: 0.6, 
                  delay: index * 0.1,
                  ease: [0.4, 0, 0.2, 1]
                }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group"
              >
                <Card className={`h-full ${service.borderColor} border-2 hover:shadow-xl transition-all duration-300 cursor-pointer ${service.bgColor} hover:bg-white`}>
                  <CardContent className="p-6 text-center space-y-4">
                    {/* Icon */}
                    <motion.div
                      className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br ${service.color} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300`}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Icon className="w-8 h-8 text-white" aria-hidden="true" />
                    </motion.div>

                    {/* Content */}
                    <div className="space-y-2">
                      <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {service.title}
                      </h3>
                      <p className="text-sm text-gray-600 leading-relaxed m-0">
                        {service.description}
                      </p>
                    </div>

                    {/* Hover indicator */}
                    <motion.div
                      className="w-full h-1 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      layoutId={`indicator-${index}`}
                    />
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>


      </div>
    </section>
  );
}