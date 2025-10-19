import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@o7c/shared';
import { useAuth } from '@o7c/shared';
import { User, Trophy, Calendar, MessageSquare, TrendingUp, Award } from 'lucide-react';

const Dashboard = () => {
  const { userData } = useAuth();
  const [stats, setStats] = useState({
    profileCompletion: 75,
    recruitingStatus: 'Active',
    collegeInterests: 3,
    upcomingEvents: 2,
    unreadMessages: 1,
    recentActivity: []
  });

  // Mock data - replace with actual API calls
  useEffect(() => {
    // Fetch dashboard stats based on user role
    if (userData?.role === 'parent') {
      setStats(prev => ({
        ...prev,
        profileCompletion: 90,
        recruitingStatus: 'Managing Players',
        collegeInterests: 5,
        upcomingEvents: 4,
        unreadMessages: 2
      }));
    }
  }, [userData]);

  const quickActions = userData?.role === 'parent' ? [
    { title: 'View Player Profiles', icon: User, href: '/players' },
    { title: 'Check Recruiting Status', icon: Trophy, href: '/recruiting' },
    { title: 'Team Calendar', icon: Calendar, href: '/calendar' },
    { title: 'Messages', icon: MessageSquare, href: '/messages' }
  ] : [
    { title: 'Update Profile', icon: User, href: '/profile' },
    { title: 'Recruiting Hub', icon: Trophy, href: '/recruiting' },
    { title: 'Team Calendar', icon: Calendar, href: '/calendar' },
    { title: 'Messages', icon: MessageSquare, href: '/messages' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">
          {userData?.role === 'parent' ? 'Parent Dashboard' : 'Player Dashboard'}
        </h1>
        <div className="text-sm text-gray-500">
          Welcome back, {userData?.firstName}!
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profile Completion</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.profileCompletion}%</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${stats.profileCompletion}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {userData?.role === 'parent' ? 'Players Managed' : 'Recruiting Status'}
            </CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userData?.role === 'parent' ? '2' : stats.recruitingStatus}
            </div>
            <p className="text-xs text-muted-foreground">
              {userData?.role === 'parent' ? 'Active players' : 'Ready for recruitment'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">College Interests</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.collegeInterests}</div>
            <p className="text-xs text-muted-foreground">
              {userData?.role === 'parent' ? 'Total across players' : 'Colleges interested'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingEvents}</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                to={action.href}
                className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <action.icon className="h-8 w-8 text-blue-600 mb-2" />
                <span className="text-sm font-medium text-center">{action.title}</span>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-4">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">Profile updated successfully</p>
                <p className="text-xs text-gray-500">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">New college interest received</p>
                <p className="text-xs text-gray-500">1 day ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">Team practice scheduled</p>
                <p className="text-xs text-gray-500">2 days ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;