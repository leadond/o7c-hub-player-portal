import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@o7c/shared';
import { useAuth } from '@o7c/shared';
import { Button } from '@o7c/shared';
import { User, Mail, Phone, MapPin, Calendar, Award, FileText, Camera } from 'lucide-react';

const Profile = () => {
  const { userData } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    height: '',
    weight: '',
    position: '',
    graduationYear: '',
    gpa: '',
    satScore: '',
    actScore: ''
  });

  useEffect(() => {
    if (userData) {
      setProfileData({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || '',
        phone: userData.phone || '',
        address: userData.address || '',
        dateOfBirth: userData.dateOfBirth || '',
        height: userData.height || '',
        weight: userData.weight || '',
        position: userData.position || '',
        graduationYear: userData.graduationYear || '',
        gpa: userData.gpa || '',
        satScore: userData.satScore || '',
        actScore: userData.actScore || ''
      });
    }
  }, [userData]);

  const handleSave = () => {
    // Handle save profile logic
    console.log('Saving profile:', profileData);
    setIsEditing(false);
  };

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Player Profile</h1>
        <Button
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          variant={isEditing ? "default" : "outline"}
        >
          {isEditing ? 'Save Changes' : 'Edit Profile'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Photo & Basic Info */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="w-32 h-32 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-16 h-16 text-blue-600" />
                  </div>
                  {isEditing && (
                    <button className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700">
                      <Camera className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <h3 className="mt-4 text-xl font-semibold">
                  {profileData.firstName} {profileData.lastName}
                </h3>
                <p className="text-gray-500">{profileData.position || 'Position'}</p>
                <div className="mt-4 w-full space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="w-4 h-4 mr-2" />
                    {profileData.email}
                  </div>
                  {profileData.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="w-4 h-4 mr-2" />
                      {profileData.phone}
                    </div>
                  )}
                  {profileData.address && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-2" />
                      {profileData.address}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Height</span>
                  <span className="text-sm font-medium">{profileData.height || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Weight</span>
                  <span className="text-sm font-medium">{profileData.weight || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">GPA</span>
                  <span className="text-sm font-medium">{profileData.gpa || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Grad Year</span>
                  <span className="text-sm font-medium">{profileData.graduationYear || 'N/A'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profileData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-sm text-gray-900">{profileData.firstName || 'Not provided'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profileData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-sm text-gray-900">{profileData.lastName || 'Not provided'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Birth
                  </label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={profileData.dateOfBirth}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-sm text-gray-900">
                      {profileData.dateOfBirth ? new Date(profileData.dateOfBirth).toLocaleDateString() : 'Not provided'}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-sm text-gray-900">{profileData.phone || 'Not provided'}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Academic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Academic Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    GPA
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="4.0"
                      value={profileData.gpa}
                      onChange={(e) => handleInputChange('gpa', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-sm text-gray-900">{profileData.gpa || 'Not provided'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Graduation Year
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={profileData.graduationYear}
                      onChange={(e) => handleInputChange('graduationYear', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-sm text-gray-900">{profileData.graduationYear || 'Not provided'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SAT Score
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={profileData.satScore}
                      onChange={(e) => handleInputChange('satScore', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-sm text-gray-900">{profileData.satScore || 'Not provided'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ACT Score
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={profileData.actScore}
                      onChange={(e) => handleInputChange('actScore', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-sm text-gray-900">{profileData.actScore || 'Not provided'}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center">
                    <FileText className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium">Academic Transcript</p>
                      <p className="text-xs text-gray-500">Last updated: Never</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Upload
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center">
                    <FileText className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium">Resume</p>
                      <p className="text-xs text-gray-500">Last updated: Never</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Upload
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center">
                    <FileText className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium">Highlight Reel</p>
                      <p className="text-xs text-gray-500">Last updated: Never</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Upload
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;