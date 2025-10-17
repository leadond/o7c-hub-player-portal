import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@o7c/shared';
import { useAuth } from '@o7c/shared';
import { Button } from '@o7c/shared';
import { Trophy, Star, Eye, MessageSquare, Calendar, MapPin, Users, TrendingUp } from 'lucide-react';

const Recruiting = () => {
  const { userData } = useAuth();
  const [recruitingStatus, setRecruitingStatus] = useState('active');
  const [collegeOffers, setCollegeOffers] = useState([]);
  const [recruitingActivity, setRecruitingActivity] = useState([]);

  // Mock data - replace with actual API calls
  useEffect(() => {
    // Mock college offers
    setCollegeOffers([
      {
        id: 1,
        school: 'University of Notre Dame',
        logo: '/college-logos/nd.png',
        status: 'offered',
        date: '2024-01-15',
        sport: 'Football',
        division: 'DI',
        location: 'South Bend, IN'
      },
      {
        id: 2,
        school: 'University of Virginia',
        logo: '/college-logos/uva.png',
        status: 'interested',
        date: '2024-01-10',
        sport: 'Football',
        division: 'DI',
        location: 'Charlottesville, VA'
      },
      {
        id: 3,
        school: 'Syracuse University',
        logo: '/college-logos/syr.png',
        status: 'contacted',
        date: '2024-01-08',
        sport: 'Football',
        division: 'DI',
        location: 'Syracuse, NY'
      }
    ]);

    // Mock recruiting activity
    setRecruitingActivity([
      {
        id: 1,
        type: 'view',
        school: 'University of Pittsburgh',
        date: '2024-01-14',
        details: 'Coach viewed your highlight reel'
      },
      {
        id: 2,
        type: 'message',
        school: 'Virginia Tech',
        date: '2024-01-12',
        details: 'New message from recruiting coordinator'
      },
      {
        id: 3,
        type: 'offer',
        school: 'University of Notre Dame',
        date: '2024-01-10',
        details: 'Scholarship offer received'
      }
    ]);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'offered':
        return 'bg-green-100 text-green-800';
      case 'interested':
        return 'bg-blue-100 text-blue-800';
      case 'contacted':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'view':
        return <Eye className="w-4 h-4 text-blue-600" />;
      case 'message':
        return <MessageSquare className="w-4 h-4 text-green-600" />;
      case 'offer':
        return <Trophy className="w-4 h-4 text-yellow-600" />;
      default:
        return <Star className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Recruiting Hub</h1>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-500">Status:</span>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(recruitingStatus)}`}>
            {recruitingStatus.charAt(0).toUpperCase() + recruitingStatus.slice(1)}
          </span>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">College Offers</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{collegeOffers.filter(o => o.status === 'offered').length}</div>
            <p className="text-xs text-muted-foreground">
              {collegeOffers.length} total interests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profile Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              Unread
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rank</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">#127</div>
            <p className="text-xs text-muted-foreground">
              State ranking
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* College Offers */}
        <Card>
          <CardHeader>
            <CardTitle>College Offers & Interests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {collegeOffers.map((offer) => (
                <div key={offer.id} className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                      <img
                        src={offer.logo}
                        alt={offer.school}
                        className="w-10 h-10 object-contain"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'block';
                        }}
                      />
                      <Trophy className="w-6 h-6 text-gray-400 hidden" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900">{offer.school}</h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(offer.status)}`}>
                        {offer.status}
                      </span>
                      <span className="text-xs text-gray-500">{offer.division}</span>
                    </div>
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                      <MapPin className="w-3 h-3 mr-1" />
                      {offer.location}
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-xs text-gray-500">
                    {new Date(offer.date).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Button className="w-full" variant="outline">
                <Star className="w-4 h-4 mr-2" />
                Update Recruiting Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recruiting Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recruitingActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">{activity.school}</span>
                    </p>
                    <p className="text-sm text-gray-600">{activity.details}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(activity.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Button className="w-full" variant="outline">
                <Calendar className="w-4 h-4 mr-2" />
                Schedule Campus Visit
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Recruiting Tools</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
              <Trophy className="w-6 h-6 mb-2" />
              <span className="text-xs text-center">Update Highlights</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
              <MessageSquare className="w-6 h-6 mb-2" />
              <span className="text-xs text-center">Contact Coaches</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
              <Calendar className="w-6 h-6 mb-2" />
              <span className="text-xs text-center">Schedule Events</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
              <Users className="w-6 h-6 mb-2" />
              <span className="text-xs text-center">Find Recruiters</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Recruiting;