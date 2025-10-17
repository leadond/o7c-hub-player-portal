import React, { useState, useEffect } from 'react';
import { useAuth } from '@o7c/shared';
import { useNavigate } from 'react-router-dom';
import { getEffectiveUserRole } from '@o7c/shared/utils/getUserRole';
import { Player, ParentPlayerAssignment } from '@o7c/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@o7c/shared/components/ui/card';
import { Button } from '@o7c/shared/components/ui/button';
import { Badge } from '@o7c/shared/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@o7c/shared/components/ui/tabs';
import { Star, ExternalLink, User, Calendar, Target, TrendingUp, FileText, DollarSign, Camera, Bell, Edit, LogOut } from 'lucide-react';

// Import tab components
import FinancialDashboard from './components/player/FinancialDashboard';
import TeamCalendar from './components/player/TeamCalendar';
import GoalsTracker from './components/player/GoalsTracker';
import PlayerProfileEditor from './components/player/PlayerProfileEditor';
import PerformanceCharts from '@o7c/shared/components/analytics/PerformanceCharts';
import NotificationSystem from '@o7c/shared/components/notifications/NotificationSystem';
import AchievementBadges from '@o7c/shared/components/gamification/AchievementBadges';
import MobileOptimizations from '@o7c/shared/components/mobile/MobileOptimizations';
import ChatSystem from '@o7c/shared/components/chat/ChatSystem';
import DocumentManager from '@o7c/shared/components/documents/DocumentManager';
import AdvancedDashboard from '@o7c/shared/components/analytics/AdvancedDashboard';
import IntegrationHub from '@o7c/shared/components/integrations/IntegrationHub';
import { useLocation } from 'react-router-dom';

const PlayerPortal = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [availablePlayers, setAvailablePlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const location = useLocation();

  // Initialize tab from query parameter (?tab=documents, etc.)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab) setActiveTab(tab);
  }, [location.search]);

  useEffect(() => {
    initializePortal();
  }, [user]);

  const initializePortal = async () => {
    if (!user) {
      console.log('DEBUG: No user object provided to initializePortal');
      return;
    }

    console.log('DEBUG: Initializing portal for user:', {
      uid: user.uid,
      email: user.email,
      playerId: user.playerId,
      displayName: user.displayName
    });

    try {
      const role = await getEffectiveUserRole(user);
      console.log('DEBUG: Determined user role:', role);
      setUserRole(role);

      if (role === 'player') {
        console.log('DEBUG: Fetching player data for player role');
        // Load player data directly
        console.log('DEBUG: Attempting to fetch player by ID:', user.playerId);
        const players = await Player.filter({ id: user.playerId });
        console.log('DEBUG: Players fetched by ID:', players);

        if (players && players.length > 0) {
          console.log('DEBUG: Setting current player from ID match:', players[0]);
          setCurrentPlayer(players[0]);
        } else {
          console.log('DEBUG: No players found by ID, trying email:', user.email);
          // If no player data found, try to find by email (for matched users)
          const emailPlayers = await Player.filter({ emailAddress: user.email });
          console.log('DEBUG: Players fetched by email:', emailPlayers);

          if (emailPlayers && emailPlayers.length > 0) {
            console.log('DEBUG: Setting current player from email match:', emailPlayers[0]);
            setCurrentPlayer(emailPlayers[0]);
          } else {
            console.log('DEBUG: No players found by email either - this is expected for new users');
            // For new users, we should still show the portal but with empty data
            // The player can then fill in their information
            // Sample data for leadond@yahoo.com and keith@nxtupsportsnation.com for demonstration
            if (user.email === 'leadond@yahoo.com') {
              setCurrentPlayer({
                id: 'sample-leadond',
                firstName: 'Derrick',
                lastName: 'Leadon',
                emailAddress: 'leadond@yahoo.com',
                position: 'Quarterback',
                graduationYear: '2025',
                teamName: 'O7C Elite',
                height: '6\'2"',
                weight: '185 lbs',
                highSchool: 'Sample High School',
                gpa: '3.8',
                stars: '4',
                photoUrl: null
              });
            } else if (user.email === 'keith@nxtupsportsnation.com') {
              setCurrentPlayer({
                id: 'sample-keith',
                firstName: 'Keith',
                lastName: 'Sample',
                emailAddress: 'keith@nxtupsportsnation.com',
                position: 'Wide Receiver',
                graduationYear: '2026',
                teamName: 'NXTP Sports Nation',
                height: '6\'0"',
                weight: '175 lbs',
                highSchool: 'Sample High School',
                gpa: '3.5',
                stars: '3',
                photoUrl: null
              });
            } else {
              setCurrentPlayer({
                id: null,
                firstName: '',
                lastName: '',
                emailAddress: user.email,
                position: '',
                graduationYear: '',
                teamName: '',
                height: '',
                weight: '',
                highSchool: '',
                gpa: '',
                stars: '',
                photoUrl: null
              });
            }
          }
        }
      } else if (role === 'parent') {
        console.log('DEBUG: Fetching assigned players for parent role');
        // Load assigned players for parent
        const assignments = await ParentPlayerAssignment.filter({
          parentEmail: user.email,
          isActive: true
        });
        console.log('DEBUG: Parent assignments fetched:', assignments);

        if (assignments && assignments.length > 0) {
          const playerIds = assignments.map(a => a.playerId);
          console.log('DEBUG: Player IDs from assignments:', playerIds);
          const players = await Player.filter({
            id: { in: playerIds }
          });
          console.log('DEBUG: Players fetched for parent:', players);

          setAvailablePlayers(players || []);
          setCurrentPlayer(players?.[0] || null);
          console.log('DEBUG: Set available players and current player for parent');
        } else {
          console.log('DEBUG: No assignments found for parent');
          // For parents with no assignments, show empty state
          setAvailablePlayers([]);
          setCurrentPlayer(null);
        }
      } else {
        console.log('DEBUG: User role is neither player nor parent:', role);
        // For unrecognized roles, show empty player portal
        setCurrentPlayer({
          id: null,
          firstName: '',
          lastName: '',
          emailAddress: user.email,
          position: '',
          graduationYear: '',
          teamName: '',
          height: '',
          weight: '',
          highSchool: '',
          gpa: '',
          stars: '',
          photoUrl: null
        });
      }
    } catch (error) {
      console.error('DEBUG: Error initializing portal:', error);
      // Show error state instead of endless loading
      setCurrentPlayer(null);
    } finally {
      console.log('DEBUG: Finished initializing portal, setting loading to false');
      setLoading(false);
    }
  };

  const renderStarRating = (stars) => {
    const starCount = parseInt(stars) || 0;
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= starCount ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-1 text-sm text-muted-foreground">({starCount}/5)</span>
      </div>
    );
  };

  const handlePlayerSwitch = (player) => {
    setCurrentPlayer(player);
    setActiveTab('overview'); // Reset to overview when switching players
  };

  const handlePaymentSuccess = (payment) => {
    // Refresh player data after successful payment
    initializePortal();
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Loading Player Profile...</h2>
              <p className="text-muted-foreground">
                {userRole === 'player'
                  ? 'Setting up your player profile. Please wait...'
                  : 'Loading assigned players. Please wait...'}
              </p>
              <div className="mt-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900 mx-auto" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // For players without existing data, show the portal with empty fields they can fill
  // Only show error for parents with no assignments or actual errors
  // This should never happen now since we always set currentPlayer
  if (!currentPlayer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Portal Loading Error</h2>
              <p className="text-muted-foreground mb-4">
                There was an issue loading your player portal. Please try again.
              </p>
              <div className="space-y-2">
                <Button
                  onClick={() => window.location.reload()}
                  className="w-full"
                >
                  Try Again
                </Button>
                <Button
                  onClick={() => navigate('/')}
                  variant="outline"
                  className="w-full"
                >
                  Go to Dashboard
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Player Photo */}
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
              {currentPlayer.photoUrl ? (
                <img 
                  src={currentPlayer.photoUrl} 
                  alt={`${currentPlayer.firstName} ${currentPlayer.lastName}`}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="h-12 w-12 text-white/70" />
              )}
            </div>
            
            {/* Player Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold mb-2">
                {currentPlayer.firstName && currentPlayer.lastName
                  ? `${currentPlayer.firstName} ${currentPlayer.lastName}`
                  : 'Player Portal'}
              </h1>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-3">
                <Badge variant="secondary" className="bg-white/20 text-white">
                  {currentPlayer.position || 'Position TBD'}
                </Badge>
                <Badge variant="secondary" className="bg-white/20 text-white">
                  Class of {currentPlayer.graduationYear || 'TBD'}
                </Badge>
                {(currentPlayer.teamName || currentPlayer.id) && (
                  <Badge variant="secondary" className="bg-white/20 text-white">
                    {currentPlayer.teamName || 'Team TBD'}
                  </Badge>
                )}
              </div>
              
              {currentPlayer.stars && (
                <div className="mb-3">
                  {renderStarRating(currentPlayer.stars)}
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <NotificationSystem userId={user?.uid} />
                {currentPlayer.id && (
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={() => window.open('https://tocplayers.fusion-brands.com/shop', '_blank')}
                    className="bg-white text-blue-900 hover:bg-gray-100"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Visit Team Store
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleLogout}
                  className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
            
            {/* Parent Player Selector */}
            {userRole === 'parent' && availablePlayers.length > 1 && (
              <div className="bg-white/10 rounded-lg p-4">
                <p className="text-sm mb-2">Select Player:</p>
                <div className="space-y-2">
                  {availablePlayers.map((player) => (
                    <Button
                      key={player.id}
                      variant={currentPlayer.id === player.id ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => handlePlayerSwitch(player)}
                      className="w-full justify-start text-white hover:bg-white/20"
                    >
                      {player.firstName} {player.lastName}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Document Verification Required */}
        {userRole === 'player' && (
          <div className="mb-6">
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">
                      Document Verification Required
                    </h3>
                    <p className="text-blue-800 mb-4">
                      To access your full player profile, please upload the required verification documents.
                      This helps ensure the security and integrity of our platform.
                    </p>
                    <Button
                      onClick={() => setActiveTab('documents')}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Upload Documents
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 lg:grid-cols-10">
            <TabsTrigger value="overview" className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="schedule" className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Schedule</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Stats</span>
            </TabsTrigger>
            <TabsTrigger value="goals" className="flex items-center gap-1">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Goals</span>
            </TabsTrigger>
            <TabsTrigger value="recruiting" className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Recruiting</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Documents</span>
            </TabsTrigger>
            <TabsTrigger value="finances" className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Finances</span>
            </TabsTrigger>
            <TabsTrigger value="media" className="flex items-center gap-1">
              <Camera className="h-4 w-4" />
              <span className="hidden sm:inline">Media</span>
            </TabsTrigger>
            <TabsTrigger value="announcements" className="flex items-center gap-1">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">News</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-1">
              <Edit className="h-4 w-4" />
              <span className="hidden sm:inline">Edit Profile</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Height:</span>
                    <span className="font-medium">{currentPlayer.height || 'Not set'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Weight:</span>
                    <span className="font-medium">{currentPlayer.weight || 'Not set'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>High School:</span>
                    <span className="font-medium">{currentPlayer.highSchool || 'Not set'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GPA:</span>
                    <span className="font-medium">{currentPlayer.gpa || 'Not set'}</span>
                  </div>
                  {!currentPlayer.id && (
                    <div className="col-span-2 mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Welcome!</strong> This is your player portal. Please use the "Edit Profile" tab to fill in your information.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Mobile Quick Actions */}
              <div className="lg:hidden">
                <MobileOptimizations player={currentPlayer} />
              </div>
              
              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">
                    Activity feed coming soon...
                  </p>
                </CardContent>
              </Card>
              
              {/* Upcoming Events */}
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Events</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">
                    No upcoming events scheduled.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="mt-6">
            <TeamCalendar player={currentPlayer} />
          </TabsContent>

          <TabsContent value="stats" className="mt-6">
            <div className="space-y-6">
              <PerformanceCharts player={currentPlayer} />
              <AchievementBadges player={currentPlayer} />
              <AdvancedDashboard player={currentPlayer} team={currentPlayer?.teamName} />
            </div>
          </TabsContent>

          <TabsContent value="goals" className="mt-6">
            <GoalsTracker player={currentPlayer} />
          </TabsContent>

          <TabsContent value="recruiting" className="mt-6">
            <IntegrationHub player={currentPlayer} userRole={userRole} />
          </TabsContent>

          <TabsContent value="documents" className="mt-6">
            <DocumentManager player={currentPlayer} userRole={userRole} />
          </TabsContent>

          <TabsContent value="finances" className="mt-6">
            <FinancialDashboard 
              player={currentPlayer} 
              onPaymentSuccess={handlePaymentSuccess}
            />
          </TabsContent>

          <TabsContent value="media" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Media Gallery</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Media gallery coming soon...
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="announcements" className="mt-6">
            <ChatSystem player={currentPlayer} userRole={userRole} />
          </TabsContent>

          <TabsContent value="profile" className="mt-6">
            <PlayerProfileEditor 
              player={currentPlayer} 
              onUpdate={initializePortal}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PlayerPortal;