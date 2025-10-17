import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@o7c/shared';
import { useAuth } from '@o7c/shared';
import { Player } from '@o7c/shared';
import { Users, User, Mail, Phone } from 'lucide-react';

const Players = () => {
  const { userData } = useAuth();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        // Fetch players associated with this parent
        // This would need to be implemented based on parent-player relationships
        const playerData = await Player.filter({ parentId: userData?.id });
        setPlayers(playerData || []);
      } catch (error) {
        console.error('Error fetching players:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userData?.id) {
      fetchPlayers();
    }
  }, [userData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Players</h1>
        <div className="text-sm text-gray-500">
          Managing {players.length} player{players.length !== 1 ? 's' : ''}
        </div>
      </div>

      {players.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Players Yet</h3>
            <p className="text-gray-500 text-center">
              You haven't been assigned any players yet. Contact your coach or administrator to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {players.map((player) => (
            <Card key={player.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  {player.firstName} {player.lastName}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="w-4 h-4 mr-2" />
                    {player.email}
                  </div>
                  {player.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="w-4 h-4 mr-2" />
                      {player.phone}
                    </div>
                  )}
                  <div className="pt-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {player.recruitingStatus || 'Active'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Players;