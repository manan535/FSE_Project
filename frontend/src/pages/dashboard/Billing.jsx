import { motion } from 'framer-motion';
import { FaCheck, FaCreditCard } from 'react-icons/fa';

const Billing = () => {
  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      features: ['Up to 5 team members', 'Basic project management', '5 GB storage', 'Email support'],
      current: true
    },
    {
      name: 'Monthly',
      price: '$29',
      period: 'per month',
      features: ['Up to 50 team members', 'Advanced features', '100 GB storage', 'Priority support']
    },
    {
      name: 'Quarterly',
      price: '$79',
      period: 'per quarter',
      features: ['Up to 100 team members', 'All Monthly features', '500 GB storage', '24/7 support'],
      savings: 'Save 9%'
    },
    {
      name: 'Yearly',
      price: '$299',
      period: 'per year',
      features: ['Unlimited members', 'All features', 'Unlimited storage', 'Dedicated support'],
      savings: 'Save 14%'
    }
  ];

  const invoices = [
    { id: 'INV-001', date: '2024-01-15', amount: '$0.00', status: 'Paid' },
    { id: 'INV-002', date: '2023-12-15', amount: '$0.00', status: 'Paid' },
    { id: 'INV-003', date: '2023-11-15', amount: '$0.00', status: 'Paid' }
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Billing & Subscription</h1>
        <p className="text-gray-400">Manage your subscription and billing information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card lg:col-span-2"
        >
          <h3 className="text-xl font-semibold text-white mb-6">Choose Your Plan</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`border-2 rounded-xl p-6 relative ${
                  plan.current ? 'border-primary-500 bg-primary-500/10' : 'border-gray-800/60 bg-gray-800/20'
                }`}
              >
                {plan.current && (
                  <div className="absolute -top-3 left-4 bg-primary-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                    Current Plan
                  </div>
                )}
                {plan.savings && (
                  <div className="absolute -top-3 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                    {plan.savings}
                  </div>
                )}

                <h4 className="text-xl font-bold text-white mb-2">{plan.name}</h4>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-white">{plan.price}</span>
                  <span className="text-gray-400 ml-2">/ {plan.period}</span>
                </div>

                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-start">
                      <FaCheck className="text-green-400 mt-1 mr-2 flex-shrink-0" />
                      <span className="text-gray-300 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  className={`w-full py-2 rounded-lg font-medium transition-colors ${
                    plan.current
                      ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      : 'bg-primary-600 text-white hover:bg-primary-700'
                  }`}
                  disabled={plan.current}
                >
                  {plan.current ? 'Current Plan' : 'Upgrade'}
                </button>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          <div className="card">
            <h3 className="text-xl font-semibold text-white mb-4">Payment Method</h3>
            <div className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-lg">
              <FaCreditCard className="text-2xl text-gray-500" />
              <div>
                <p className="font-medium text-white">No payment method</p>
                <p className="text-sm text-gray-500">Add a payment method to upgrade</p>
              </div>
            </div>
            <button className="w-full mt-4 btn-outline">
              Add Payment Method
            </button>
          </div>

          <div className="card">
            <h3 className="text-xl font-semibold text-white mb-4">Usage</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Team Members</span>
                  <span className="font-medium text-white">3 / 5</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div className="bg-primary-600 h-2 rounded-full" style={{ width: '60%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Storage</span>
                  <span className="font-medium text-white">2.3 GB / 5 GB</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div className="bg-primary-600 h-2 rounded-full" style={{ width: '46%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card"
      >
        <h3 className="text-xl font-semibold text-white mb-6">Billing History</h3>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800/60">
                <th className="text-left py-3 px-4 font-semibold text-gray-400">Invoice</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-400">Date</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-400">Amount</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-400">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="border-b border-gray-800/30 hover:bg-gray-800/30 transition-colors">
                  <td className="py-3 px-4 font-medium text-white">{invoice.id}</td>
                  <td className="py-3 px-4 text-gray-400">{invoice.date}</td>
                  <td className="py-3 px-4 text-white">{invoice.amount}</td>
                  <td className="py-3 px-4">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-300">
                      {invoice.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button className="text-primary-400 hover:text-primary-300 text-sm font-medium transition-colors">
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default Billing;