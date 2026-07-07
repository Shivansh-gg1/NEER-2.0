import { motion } from 'motion/react';

const partners = [
  {
    name: "National Informatics Centre",
    abbreviation: "NIC",
    logo: "🏛️",
    description: "Technology Partner"
  },
  {
    name: "Ministry of Jal Shakti",
    abbreviation: "MJS",
    logo: "💧",
    description: "Government Partner"
  },
  {
    name: "Data.gov.in",
    abbreviation: "DATA.GOV",
    logo: "📊",
    description: "Data Partner"
  },
  {
    name: "Central Ground Water Board",
    abbreviation: "CGWB",
    logo: "🌍",
    description: "Technical Partner"
  },
  {
    name: "Bureau of Indian Standards",
    abbreviation: "BIS",
    logo: "✓",
    description: "Standards Partner"
  },
  {
    name: "Indian Meteorological Department",
    abbreviation: "IMD",
    logo: "🌤️",
    description: "Weather Partner"
  }
];

export function PartnersSection() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Trusted Partners & Affiliations
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto m-0">
            Collaborating with leading government agencies and institutions to deliver reliable, standardized solutions
          </p>
        </motion.div>

        {/* Partners Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-12">
          {partners.map((partner, index) => (
            <motion.div
              key={partner.name}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ 
                duration: 0.5, 
                delay: index * 0.1,
                ease: [0.4, 0, 0.2, 1]
              }}
              whileHover={{ y: -8, scale: 1.05 }}
              className="group"
            >
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-lg hover:border-blue-200 transition-all duration-300 text-center h-full flex flex-col">
                {/* Logo/Icon */}
                <motion.div
                  className="text-4xl mb-3"
                  whileHover={{ scale: 1.2, rotate: 5 }}
                  transition={{ duration: 0.3 }}
                >
                  {partner.logo}
                </motion.div>
                
                {/* Partner Name */}
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-sm mb-1 group-hover:text-blue-600 transition-colors">
                    {partner.abbreviation}
                  </h3>
                  <p className="text-xs text-gray-600 leading-tight m-0 mb-2">
                    {partner.name}
                  </p>
                  <p className="text-xs text-blue-600 font-medium m-0">
                    {partner.description}
                  </p>
                </div>

                {/* Hover indicator */}
                <motion.div
                  className="w-full h-0.5 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  layoutId={`partner-indicator-${index}`}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Certifications & Standards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm"
        >
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Certifications & Compliance
            </h3>
            <p className="text-gray-600 max-w-2xl mx-auto m-0">
              Our platform adheres to the highest standards of data security, accessibility, and technical excellence
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                icon: "🔒",
                title: "ISO 27001",
                description: "Information Security Management"
              },
              {
                icon: "♿",
                title: "WCAG 2.1 AA",
                description: "Web Accessibility Guidelines"
              },
              {
                icon: "🛡️",
                title: "CERT-In",
                description: "Cybersecurity Compliance"
              },
              {
                icon: "📋",
                title: "GIGW",
                description: "Government Guidelines Compliance"
              }
            ].map((cert, index) => (
              <motion.div
                key={cert.title}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="text-center p-4 rounded-lg bg-gray-50 hover:bg-blue-50 transition-colors duration-300"
              >
                <div className="text-2xl mb-2">{cert.icon}</div>
                <h4 className="font-bold text-gray-900 mb-1">{cert.title}</h4>
                <p className="text-sm text-gray-600 m-0">{cert.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Government Initiative Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center mt-12"
        >
          <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-orange-100 to-green-100 px-6 py-3 rounded-full border border-orange-200">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">🇮🇳</span>
            </div>
            <div className="text-sm">
              <span className="font-bold text-gray-900">Digital India Initiative</span>
              <span className="text-gray-600 ml-2">• Government of India</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}