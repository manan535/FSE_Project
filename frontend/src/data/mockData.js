import {
  Users,
  UserCheck,
  CreditCard,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

export const currentUser = {
  name: 'Manan Sharma',
  email: 'manan@acmecorp.io',
  avatar: null,
  role: 'Admin',
};

export const tenant = {
  name: 'Acme Corp',
  plan: 'Business Pro',
  id: 'tenant_acme_29x',
};

export const statsCards = [
  {
    id: 'total-users',
    title: 'Total Users',
    value: '2,847',
    change: '+12.5%',
    trend: 'up',
    icon: Users,
    color: 'primary',
  },
  {
    id: 'active-users',
    title: 'Active Users',
    value: '1,923',
    change: '+8.2%',
    trend: 'up',
    icon: UserCheck,
    color: 'success',
  },
  {
    id: 'current-plan',
    title: 'Current Plan',
    value: 'Business Pro',
    change: 'Renews Apr 15',
    trend: 'neutral',
    icon: CreditCard,
    color: 'warning',
  },
  {
    id: 'monthly-usage',
    title: 'Monthly Usage',
    value: '84.2%',
    change: '-3.1%',
    trend: 'down',
    icon: BarChart3,
    color: 'danger',
  },
];

export const recentActivity = [
  {
    id: 1,
    user: 'Sarah Chen',
    action: 'Invited 3 new team members',
    date: '2 min ago',
    status: 'completed',
  },
  {
    id: 2,
    user: 'James Wilson',
    action: 'Updated billing information',
    date: '15 min ago',
    status: 'completed',
  },
  {
    id: 3,
    user: 'Emily Parker',
    action: 'Exported usage report',
    date: '1 hour ago',
    status: 'completed',
  },
  {
    id: 4,
    user: 'Michael Brown',
    action: 'Changed user role to Admin',
    date: '2 hours ago',
    status: 'pending',
  },
  {
    id: 5,
    user: 'Lisa Anderson',
    action: 'Upgraded plan to Business Pro',
    date: '5 hours ago',
    status: 'completed',
  },
  {
    id: 6,
    user: 'David Kim',
    action: 'Removed API key ****-7f2a',
    date: '1 day ago',
    status: 'completed',
  },
];

export const usageData = [
  { name: 'Mon', usage: 4200, limit: 5000 },
  { name: 'Tue', usage: 3800, limit: 5000 },
  { name: 'Wed', usage: 4600, limit: 5000 },
  { name: 'Thu', usage: 4100, limit: 5000 },
  { name: 'Fri', usage: 4800, limit: 5000 },
  { name: 'Sat', usage: 2900, limit: 5000 },
  { name: 'Sun', usage: 3200, limit: 5000 },
];

export const navItems = [
  { label: 'Dashboard', icon: 'LayoutDashboard', path: '/dashboard', active: true },
  { label: 'Users', icon: 'Users', path: '/users', active: false },
  { label: 'Billing', icon: 'CreditCard', path: '/billing', active: false },
  { label: 'Settings', icon: 'Settings', path: '/settings', active: false },
];
