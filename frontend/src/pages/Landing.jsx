import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaRocket, FaUsers, FaChartLine, FaShieldAlt, FaCheck, FaStar } from 'react-icons/fa';

const Landing = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <FaRocket className="text-4xl text-violet-400" />,
      title: 'Fast & Scalable',
      description: 'Built with modern technologies to handle growing teams and workloads effortlessly.'
    },
    {
      icon: <FaUsers className="text-4xl text-violet-400" />,
      title: 'Team Collaboration',
      description: 'Work together seamlessly with real-time updates and powerful workspace management.'
    },
    {
      icon: <FaChartLine className="text-4xl text-violet-400" />,
      title: 'Analytics & Insights',
      description: 'Track progress with detailed analytics and make data-driven decisions.'
    },
    {
      icon: <FaShieldAlt className="text-4xl text-violet-400" />,
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security with multi-tenant architecture and data isolation.'
    }
  ];

  const pricingPlans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      features: [
        'Up to 5 team members',
        'Basic project management',
        '5 GB storage',
        'Email support'
      ],
      popular: false
    },
    {
      name: 'Monthly',
      price: '$29',
      period: 'per month',
      features: [
        'Up to 50 team members',
        'Advanced project management',
        '100 GB storage',
        'Priority support',
        'Advanced analytics',
        'Custom integrations'
      ],
      popular: false
    },
    {
      name: 'Quarterly',
      price: '$79',
      period: 'per quarter',
      features: [
        'Up to 100 team members',
        'Everything in Monthly',
        '500 GB storage',
        '24/7 priority support',
        'Custom branding',
        'API access'
      ],
      popular: true,
      savings: 'Save 9%'
    },
    {
      name: 'Yearly',
      price: '$299',
      period: 'per year',
      features: [
        'Unlimited team members',
        'Everything in Quarterly',
        'Unlimited storage',
        'Dedicated support manager',
        'On-premise deployment option',
        'SLA guarantee'
      ],
      popular: false,
      savings: 'Save 14%'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'CEO at TechCorp',
      content: 'This platform transformed how our team collaborates. The multi-tenant architecture is perfect for our growing business.',
      rating: 5
    },
    {
      name: 'Michael Chen',
      role: 'Product Manager',
      content: 'The best project management tool we\'ve used. Intuitive interface and powerful features that actually help us get work done.',
      rating: 5
    },
    {
      name: 'Emily Rodriguez',
      role: 'Team Lead',
      content: 'Switching workspaces is seamless, and the analytics help us make better decisions. Highly recommended!',
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-[#0a0e1a] relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#0a0e1a] to-[#1e1b4b]" />
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-violet-600 rounded-full opacity-10 blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-violet-600 rounded-full opacity-5 blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />
      </div>

      <div className="relative z-10">
        {/* Navigation */}
        <nav className="fixed top-0 w-full bg-gray-900/60 backdrop-blur-xl z-50 border-b border-gray-800/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <FaRocket className="text-violet-400 text-2xl" />
                <span className="ml-2 text-xl font-bold text-white">ScaleNest</span>
              </div>
              <div className="flex items-center gap-4">
                <button onClick={() => navigate('/login')} className="btn-secondary">
                  Login
                </button>
                <button onClick={() => navigate('/register')} className="btn-primary">
                  Get Started
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="pt-32 pb-20 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-5xl md:text-6xl font-bold text-white mb-6"
            >
              Build Better Together
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto"
            >
              The modern multi-tenant ScaleNest for teams that want to collaborate,
              manage projects, and scale efficiently.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <button onClick={() => navigate('/register')} className="btn-primary text-lg px-8 py-3">
                Start Free Trial
              </button>
              <button className="btn-outline text-lg px-8 py-3">
                Watch Demo
              </button>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-white mb-4">Powerful Features</h2>
              <p className="text-xl text-gray-400">Everything you need to manage your team and projects</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="card text-center hover:border-gray-700 transition-all duration-300"
                >
                  <div className="flex justify-center mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-400">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-white mb-4">Simple, Transparent Pricing</h2>
              <p className="text-xl text-gray-400">Choose the plan that fits your team</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {pricingPlans.map((plan, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className={`card relative ${plan.popular ? 'border-2 border-primary-500 shadow-[0_0_30px_rgba(124,58,237,0.15)]' : ''
                    }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-primary-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                        Most Popular
                      </span>
                    </div>
                  )}
                  {plan.savings && (
                    <div className="absolute -top-4 right-4">
                      <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                        {plan.savings}
                      </span>
                    </div>
                  )}
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                    <span className="text-gray-400 ml-2">/ {plan.period}</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, fIndex) => (
                      <li key={fIndex} className="flex items-start">
                        <FaCheck className="text-green-400 mt-1 mr-2 flex-shrink-0" />
                        <span className="text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => navigate('/register')}
                    className={`w-full py-3 rounded-lg font-medium transition-colors duration-200 ${plan.popular
                        ? 'bg-primary-600 text-white hover:bg-primary-700'
                        : 'bg-gray-800 text-gray-200 hover:bg-gray-700'
                      }`}
                  >
                    Get Started
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-white mb-4">What Our Users Say</h2>
              <p className="text-xl text-gray-400">Trusted by teams around the world</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="card"
                >
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <FaStar key={i} className="text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-300 mb-6 italic">&quot;{testimonial.content}&quot;</p>
                  <div>
                    <p className="font-semibold text-white">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="card text-center py-16 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-600/20 to-primary-800/20" />
              <div className="relative z-10">
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  viewport={{ once: true }}
                  className="text-4xl font-bold text-white mb-6"
                >
                  Ready to Get Started?
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  viewport={{ once: true }}
                  className="text-xl text-gray-300 mb-8"
                >
                  Join thousands of teams already using our platform
                </motion.p>
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  viewport={{ once: true }}
                  onClick={() => navigate('/register')}
                  className="bg-primary-600 text-white px-8 py-3 rounded-lg font-medium text-lg hover:bg-primary-700 transition-colors duration-200 shadow-[0_8px_30px_rgba(124,58,237,0.3)]"
                >
                  Start Your Free Trial
                </motion.button>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-gray-800/60 text-white py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              <div>
                <div className="flex items-center mb-4">
                  <FaRocket className="text-violet-400 text-2xl" />
                  <span className="ml-2 text-xl font-bold">ScaleNest</span>
                </div>
                <p className="text-gray-400">Modern multi-tenant solution for growing teams.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Product</h4>
                <ul className="space-y-2 text-gray-400">
                  <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                  <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Company</h4>
                <ul className="space-y-2 text-gray-400">
                  <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Support</h4>
                <ul className="space-y-2 text-gray-400">
                  <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-800/60 pt-8 text-center text-gray-500">
              <p>&copy; 2024 ScaleNest. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Landing;