import { Project, User } from '../App';
import { ClipboardList, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface GlobalDashboardProps {
  projects: Project[];
  user: User;
}

export function GlobalDashboard({ projects, user }: GlobalDashboardProps) {
  // Calculate statistics
  const totalProjects = projects.length;
  const activeProjects = projects.filter(
    (project) => project.status !== 'Completed'
  ).length;
  const completedProjects = projects.filter(
    (project) => project.status === 'Completed'
  ).length;
  const highPriorityProjects = projects.filter(
    (project) => project.priority === 'High' && project.status !== 'Completed'
  ).length;

  // Project Distribution by Status
  const statusDistribution = [
    {
      name: 'To Do',
      value: projects.filter((project) => project.status === 'To Do').length,
      color: '#9CA3AF',
    },
    {
      name: 'In Progress',
      value: projects.filter((project) => project.status === 'In Progress').length,
      color: '#1F2937',
    },
    {
      name: 'Completed',
      value: projects.filter((project) => project.status === 'Completed').length,
      color: '#6B7280',
    },
    {
      name: 'Revision Required',
      value: projects.filter((project) => project.status === 'Revision Required').length,
      color: '#FEE2E2',
    },
  ];

  // Project Priority Distribution
  const priorityDistribution = [
    {
      name: 'Low',
      value: projects.filter((project) => project.priority === 'Low').length,
    },
    {
      name: 'Medium',
      value: projects.filter((project) => project.priority === 'Medium').length,
    },
    {
      name: 'High',
      value: projects.filter((project) => project.priority === 'High').length,
    },
    {
      name: 'Not Set',
      value: projects.filter((project) => !project.priority).length,
    },
  ];

  const statCards = [
    {
      title: 'Total Projects',
      value: totalProjects,
      icon: ClipboardList,
      bgColor: 'bg-gray-100',
      iconColor: 'text-gray-700',
    },
    {
      title: 'Active Projects',
      value: activeProjects,
      icon: Clock,
      bgColor: 'bg-gray-800',
      iconColor: 'text-white',
      textColor: 'text-white',
    },
    {
      title: 'Completed Projects',
      value: completedProjects,
      icon: CheckCircle,
      bgColor: 'bg-gray-200',
      iconColor: 'text-gray-800',
    },
    {
      title: 'High Priority',
      value: highPriorityProjects,
      icon: AlertTriangle,
      bgColor: 'bg-red-600',
      iconColor: 'text-white',
      textColor: 'text-white',
    },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-gray-900 mb-2">
          {getGreeting()}, {user.fullName.split(' ')[0]}!
        </h2>
        <p className="text-gray-600">
          Welcome to your dashboard. Here's an overview of your projects and workload.
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className={`${stat.bgColor} border border-gray-200 rounded-lg p-6`}
            >
              <div className="flex items-center justify-between mb-4">
                <Icon className={`w-8 h-8 ${stat.iconColor}`} />
              </div>
              <div className={`text-3xl mb-2 ${stat.textColor || 'text-gray-900'}`}>
                {stat.value}
              </div>
              <div className={`${stat.textColor || 'text-gray-700'}`}>
                {stat.title}
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Distribution by Status */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-gray-900 mb-6">Project Distribution by Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => (value > 0 ? `${name}: ${value}` : '')}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {statusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Project Priority Distribution */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-gray-900 mb-6">Project Priority Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={priorityDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #E5E7EB',
                  borderRadius: '0.375rem',
                }}
              />
              <Legend />
              <Bar dataKey="value" fill="#DC2626" name="Projects" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}