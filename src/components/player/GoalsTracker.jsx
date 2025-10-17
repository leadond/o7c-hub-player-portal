import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Plus, Target, Calendar, CheckCircle, Clock, X } from 'lucide-react';
import { filter as filterPlayerGoals, create as createPlayerGoal, update as updatePlayerGoal } from '../../api/entities/PlayerGoal';

const GoalsTracker = ({ player }) => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    goalType: 'Athletic',
    title: '',
    description: '',
    targetDate: '',
    progressPercent: 0
  });

  const goalTypes = ['Athletic', 'Academic', 'Personal Development', 'Recruiting', 'Team'];
  const goalStatuses = ['Not Started', 'In Progress', 'Completed', 'Cancelled'];

  useEffect(() => {
    loadGoals();
  }, [player?.id]);

  const loadGoals = async () => {
    if (!player?.id) return;
    
    try {
      const playerGoals = await filterPlayerGoals({
        playerId: player.id
      });
      
      const sortedGoals = (playerGoals || []).sort((a, b) => {
        // Sort by status (active first) then by target date
        if (a.status === 'Completed' && b.status !== 'Completed') return 1;
        if (b.status === 'Completed' && a.status !== 'Completed') return -1;
        return new Date(a.targetDate) - new Date(b.targetDate);
      });
      
      setGoals(sortedGoals);
    } catch (error) {
      console.error('Error loading goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddGoal = async (e) => {
    e.preventDefault();
    
    if (!newGoal.title.trim()) {
      alert('Please enter a goal title');
      return;
    }
    
    try {
      await createPlayerGoal({
        playerId: player.id,
        goalType: newGoal.goalType,
        title: newGoal.title.trim(),
        description: newGoal.description.trim(),
        targetDate: newGoal.targetDate,
        status: 'Not Started',
        progressPercent: 0,
        createdDate: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      });
      
      // Reset form and reload goals
      setNewGoal({
        goalType: 'Athletic',
        title: '',
        description: '',
        targetDate: '',
        progressPercent: 0
      });
      setShowAddGoal(false);
      await loadGoals();
      
    } catch (error) {
      console.error('Error creating goal:', error);
      alert('Error creating goal. Please try again.');
    }
  };

  const updateGoalProgress = async (goalId, progressPercent) => {
    try {
      const status = progressPercent >= 100 ? 'Completed' : 
                    progressPercent > 0 ? 'In Progress' : 'Not Started';
      
      await updatePlayerGoal(goalId, {
        progressPercent,
        status,
        lastUpdated: new Date().toISOString()
      });
      
      await loadGoals();
    } catch (error) {
      console.error('Error updating goal progress:', error);
      alert('Error updating progress. Please try again.');
    }
  };

  const getGoalTypeColor = (goalType) => {
    const colors = {
      'Athletic': 'bg-blue-100 text-blue-800',
      'Academic': 'bg-green-100 text-green-800',
      'Personal Development': 'bg-purple-100 text-purple-800',
      'Recruiting': 'bg-orange-100 text-orange-800',
      'Team': 'bg-red-100 text-red-800'
    };
    return colors[goalType] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status) => {
    const colors = {
      'Not Started': 'bg-gray-100 text-gray-800',
      'In Progress': 'bg-yellow-100 text-yellow-800',
      'Completed': 'bg-green-100 text-green-800',
      'Cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const isOverdue = (targetDate, status) => {
    return status !== 'Completed' && new Date(targetDate) < new Date();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No target date';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Goal Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Goals Tracker</h2>
        <Button onClick={() => setShowAddGoal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Goal
        </Button>
      </div>

      {/* Goals Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {goalTypes.map(type => {
          const typeGoals = goals.filter(g => g.goalType === type);
          const completed = typeGoals.filter(g => g.status === 'Completed').length;
          
          return (
            <Card key={type}>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold">{completed}/{typeGoals.length}</div>
                  <p className="text-sm text-muted-foreground">{type}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add Goal Form */}
      {showAddGoal && (
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              Add New Goal
              <Button variant="ghost" size="sm" onClick={() => setShowAddGoal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddGoal} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="goalType">Goal Type</Label>
                  <select
                    id="goalType"
                    value={newGoal.goalType}
                    onChange={(e) => setNewGoal(prev => ({ ...prev, goalType: e.target.value }))}
                    className="w-full p-2 border rounded-md"
                  >
                    {goalTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="targetDate">Target Date</Label>
                  <Input
                    id="targetDate"
                    type="date"
                    value={newGoal.targetDate}
                    onChange={(e) => setNewGoal(prev => ({ ...prev, targetDate: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="title">Goal Title</Label>
                <Input
                  id="title"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter your goal title"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newGoal.description}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your goal and how you plan to achieve it"
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowAddGoal(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  <Target className="h-4 w-4 mr-2" />
                  Create Goal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Goals List */}
      {goals.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No goals set yet. Click "Add Goal" to get started!
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => {
            const overdue = isOverdue(goal.targetDate, goal.status);
            
            return (
              <Card key={goal.id} className={overdue ? 'border-red-200' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2 mb-2">
                        {goal.title}
                        <Badge className={getGoalTypeColor(goal.goalType)}>
                          {goal.goalType}
                        </Badge>
                        <Badge className={getStatusColor(goal.status)}>
                          {goal.status}
                        </Badge>
                        {overdue && (
                          <Badge variant="destructive">
                            Overdue
                          </Badge>
                        )}
                      </CardTitle>
                      
                      {goal.description && (
                        <p className="text-sm text-muted-foreground">
                          {goal.description}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {formatDate(goal.targetDate)}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Progress</span>
                      <span className="text-sm text-muted-foreground">
                        {goal.progressPercent}%
                      </span>
                    </div>
                    <Progress value={goal.progressPercent} className="h-2" />
                  </div>
                  
                  {/* Progress Update Controls */}
                  {goal.status !== 'Completed' && goal.status !== 'Cancelled' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateGoalProgress(goal.id, Math.min(100, goal.progressPercent + 25))}
                      >
                        +25%
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateGoalProgress(goal.id, Math.max(0, goal.progressPercent - 25))}
                      >
                        -25%
                      </Button>
                      {goal.progressPercent < 100 && (
                        <Button
                          size="sm"
                          onClick={() => updateGoalProgress(goal.id, 100)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Mark Complete
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GoalsTracker;