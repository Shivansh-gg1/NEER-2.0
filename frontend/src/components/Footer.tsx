import { motion } from 'motion/react';
import { 
  Mail, 
  Phone, 
  MapPin, 
  ExternalLink, 
  Heart,
  Facebook,
  Twitter,
  Youtube,
  Linkedin
} from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    services: [
      { name: "Feasibility Assessment", href: "#assessment" },
      { name: "Water Calculator", href: "#calculator" },
      { name: "Subsidy Information", href: "#subsidy" },
      { name: "Expert Consultation", href: "#expert" }
    ],
    resources: [
      { name: "Implementation Guide", href: "#guide" },
      { name: "Technical Standards", href: "#standards" },
      { name: "Case Studies", href: "#cases" },
      { name: "Research Papers", href: "#research" }
    ],
    support: [
      { name: "Help Center", href: "#help" },
      { name: "Contact Support", href: "#contact" },
      { name: "Training Videos", href: "#training" },
      { name: "Community Forum", href: "#forum" }
    ],
    legal: [
      { name: "Terms of Service", href: "#terms" },
      { name: "Privacy Policy", href: "#privacy" },
      { name: "Accessibility Statement", href: "#accessibility" },
      { name: "Data Protection", href: "#data" }
    ]
  };

  const socialLinks = [
    { name: "Facebook", icon: Facebook, href: "#facebook", color: "hover:text-blue-600" },
    { name: "Twitter", icon: Twitter, href: "#twitter", color: "hover:text-sky-500" },
    { name: "LinkedIn", icon: Linkedin, href: "#linkedin", color: "hover:text-blue-700" },
    { name: "YouTube", icon: Youtube, href: "#youtube", color: "hover:text-red-600" }
  ];

  return (
    <footer className="bg-[#1a365d] text-white">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              {/* Logo */}
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-md flex items-center justify-center">
                    <span className="text-white font-bold">N</span>
                  </div>
                </div>
                <div>
                  <div className="font-bold text-xl">NEER</div>
                  <div className="text-sm text-blue-200">Government of India</div>
                </div>
              </div>

              <p className="text-blue-100 leading-relaxed m-0 mb-6">
                Empowering India's sustainable water future through intelligent rainwater harvesting solutions and community-driven conservation initiatives.
              </p>

              {/* Contact Info */}
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Phone className="w-4 h-4 text-blue-300 flex-shrink-0" aria-hidden="true" />
                  <span className="text-sm">1800-NEER-HELP (1800-6337-4357)</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="w-4 h-4 text-blue-300 flex-shrink-0" aria-hidden="true" />
                  <span className="text-sm">support@neer.gov.in</span>
                </div>
                <div className="flex items-start space-x-3">
                  <MapPin className="w-4 h-4 text-blue-300 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <span className="text-sm">Ministry of Jal Shakti<br />Shram Shakti Bhawan, New Delhi - 110001</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Links Columns */}
          {Object.entries(footerLinks).map(([category, links], index) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="space-y-4"
            >
              <h3 className="font-bold text-white capitalize mb-4">
                {category === 'legal' ? 'Legal' : category}
              </h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-blue-100 hover:text-white transition-colors duration-200 text-sm flex items-center group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-blue-900 rounded"
                    >
                      {link.name}
                      <ExternalLink className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200" aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Social Media & Newsletter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="border-t border-blue-700 pt-8 mt-12"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Social Links */}
            <div>
              <h3 className="font-bold text-white mb-4">Follow Us</h3>
              <div className="flex space-x-4">
                {socialLinks.map((social) => {
                  const Icon = social.icon;
                  return (
                    <motion.a
                      key={social.name}
                      href={social.href}
                      className={`w-10 h-10 bg-blue-700 hover:bg-blue-600 rounded-lg flex items-center justify-center text-blue-100 ${social.color} transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400`}
                      whileHover={{ scale: 1.1, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      aria-label={`Follow us on ${social.name}`}
                    >
                      <Icon className="w-5 h-5" aria-hidden="true" />
                    </motion.a>
                  );
                })}
              </div>
            </div>

            {/* Newsletter Signup */}
            <div>
              <h3 className="font-bold text-white mb-4">Stay Updated</h3>
              <div className="flex space-x-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-2 bg-blue-700 border border-blue-600 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  aria-label="Email address for newsletter"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-2 bg-blue-500 hover:bg-blue-400 rounded-lg font-medium transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                >
                  Subscribe
                </motion.button>
              </div>
              <p className="text-xs text-blue-200 mt-2 m-0">
                Get updates on policies, events, and water conservation tips
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-blue-700 bg-blue-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0"
          >
            <div className="flex items-center space-x-6 text-sm text-blue-200">
              <span>© {currentYear} NEER - Government of India</span>
              <span>•</span>
              <span>All rights reserved</span>
              <span>•</span>
              <span>Version 2.1.0</span>
            </div>

            <div className="flex items-center space-x-2 text-sm text-blue-200">
              <span>Made with</span>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Heart className="w-4 h-4 text-red-400 fill-current" aria-hidden="true" />
              </motion.div>
              <span>for India</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Accessibility Helper */}
      <motion.button
        className="fixed bottom-4 right-4 w-12 h-12 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center text-white shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 z-50"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        aria-label="Accessibility options"
        title="Accessibility Options"
      >
        <span className="text-xl" role="img" aria-label="accessibility">♿</span>
      </motion.button>
    </footer>
  );
}