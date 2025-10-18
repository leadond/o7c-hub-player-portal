import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@o7c/shared';
import { Button } from '@o7c/shared';
import { useAuth } from '@o7c/shared';
import { User, Search, Filter, Star, MapPin, Calendar, Trophy, Mail, Phone, MoreVertical } from 'lucide-react';

const Players = () => {
  const { userData } = useAuth();
  const [players, setPlayers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('all');
  const [selectedGradYear, setSelectedGradYear] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // grid or list

  useEffect(() => {
    // Mock players data - in real app, this would come from API
    setPlayers([
      {
        id: 1,
        firstName: 'Alex',
        lastName: 'Johnson',
        position: 'Quarterback',
        graduationYear: 2025,
        height: '6\'2"',
        weight: '195 lbs',
        gpa: 3.8,
        location: 'Los Angeles, CA',
        highSchool: 'Westfield High School',
        stats: {
          passingYards: 2850,
          touchdowns: 28,
          completionRate: 68.5
        },
        recruiting: {
          offers: 5,
          interests: 12,
          status: 'committed'
        },
        avatar: '/avatars/alex-johnson.jpg',
        commitment: 'UCLA'
      },
      {
        id: 2,
        firstName: 'Sarah',
        lastName: 'Williams',
        position: 'Running Back',
        graduationYear: 2024,
        height: '5\'8"',
        weight: '165 lbs',
        gpa: 3.9,
        location: 'San Diego, CA',
        highSchool: 'Central High School',
        stats: {
          rushingYards: 1650,
          touchdowns: 22,
          yardsPerCarry: 6.2
        },
        recruiting: {
          offers: 8,
          interests: 15,
          status: 'active'
        },
        avatar: '/avatars/sarah-williams.jpg',
        commitment: null
      },
      {
        id: 3,
        firstName: 'Marcus',
        lastName: 'Davis',
        position: 'Wide Receiver',
        graduationYear: 2025,
        height: '6\'0"',
        weight: '180 lbs',
        gpa: 3.6,
        location: 'Orange County, CA',
        highSchool: 'Riverside Prep',
        stats: {
          receptions: 65,
          receivingYards: 1200,
          touchdowns: 15
        },
        recruiting: {
          offers: 3,
          interests: 8,
          status: 'active'
        },
        avatar: '/avatars/marcus-davis.jpg',
        commitment: null
      },
      {
        id: 4,
        firstName: 'Emma',
        lastName: 'Thompson',
        position: 'Linebacker',
        graduationYear: 2024,
        height: '5\'10"',
        weight: '175 lbs',
        gpa: 4.0,
        location: 'Irvine, CA',
        highSchool: 'North Valley High',
        stats: {
          tackles: 95,
          sacks: 8,
          interceptions: 3
        },
        recruiting: {
          offers: 12,
          interests: 20,
          status: 'committed'
        },
        avatar: '/avatars/emma-thompson.jpg',
        commitment: 'Stanford'
      }
    ]);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'committed': return 'bg-green-100 text-green-800';
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredPlayers = players.filter(player => {
    const matchesSearch = 
      player.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.highSchool.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPosition = selectedPosition === 'all' || player.position === selectedPosition;
    const matchesGradYear = selectedGradYear === 'all' || player.graduationYear.toString() === selectedGradYear;
    
    return matchesSearch && matchesPosition && matchesGradYear;
  });

  const positions = [...new Set(players.map(p => p.position))];
  const gradYears = [...new Set(players.map(p => p.graduationYear))].sort();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Team Players</h1>
        <div className="flex items-center space-x-2">
          <div className="flex rounded-lg border">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 text-sm rounded-l-lg ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 text-sm rounded-r-lg ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search players..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <select
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Positions</option>
              {positions.map(position => (
                <option key={position} value={position}>{position}</option>
              ))}
            </select>
            
            <select
              value={selectedGradYear}
              onChange={(e) => setSelectedGradYear(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Years</option>
              {gradYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Players</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredPlayers.length}</div>
            <p className="text-xs text-muted-foreground">
              {players.length} total in database
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Committed</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredPlayers.filter(p => p.recruiting.status === 'committed').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Players with commitments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Recruiting</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredPlayers.filter(p => p.recruiting.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently being recruited
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg GPA</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(filteredPlayers.reduce((sum, p) => sum + p.gpa, 0) / filteredPlayers.length).toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              Team academic average
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Players Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlayers.map((player) => (
            <Card key={player.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      <img
                        src={player.avatar}
                        alt={`${player.firstName} ${player.lastName}`}
                        className="w-12 h-12 rounded-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <User className="w-6 h-6 text-gray-400 hidden" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {player.firstName} {player.lastName}
                      </h3>
                      <p className="text-sm text-gray-600">{player.position}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(player.recruiting.status)}`}>
                    {player.recruiting.status}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    Class of {player.graduationYear}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    {player.location}
                  </div>
                  <div className="text-sm text-gray-600">
                    {player.height} • {player.weight} • {player.gpa} GPA
                  </div>
                </div>

                {player.commitment && (
                  <div className="mb-4 p-2 bg-green-50 rounded-lg">
                    <div className="flex items-center">
                      <Trophy className="w-4 h-4 text-green-600 mr-2" />
                      <span className="text-sm font-medium text-green-800">
                        Committed to {player.commitment}
                      </span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                  <div className="bg-gray-50 p-2 rounded">
                    <div className="text-lg font-bold text-blue-600">{player.recruiting.offers}</div>
                    <div className="text-xs text-gray-600">Offers</div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <div className="text-lg font-bold text-green-600">{player.recruiting.interests}</div>
                    <div className="text-xs text-gray-600">Interests</div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <div className="text-lg font-bold text-purple-600">{Object.keys(player.stats).length}</div>
                    <div className="text-xs text-gray-600">Stats</div>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button size="sm" className="flex-1">
                    View Profile
                  </Button>
                  <Button variant="outline" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Player
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Position
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Class
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      GPA
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recruiting
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPlayers.map((player) => (
                    <tr key={player.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                            <img
                              src={player.avatar}
                              alt={`${player.firstName} ${player.lastName}`}
                              className="w-10 h-10 rounded-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                            <User className="w-5 h-5 text-gray-400 hidden" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {player.firstName} {player.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{player.highSchool}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {player.position}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {player.graduationYear}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {player.gpa}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {player.recruiting.offers} offers • {player.recruiting.interests} interests
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(player.recruiting.status)}`}>
                          {player.recruiting.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">
                            View
                          </Button>
                          <Button size="sm" variant="outline">
                            <Mail className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {filteredPlayers.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No players found
            </h3>
            <p className="text-gray-500">
              Try adjusting your search criteria or filters
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Players;