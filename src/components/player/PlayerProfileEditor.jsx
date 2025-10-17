import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@o7c/shared/components/ui/card';
import { Button } from '@o7c/shared/components/ui/button';
import { Input } from '@o7c/shared/components/ui/input';
import { Label } from '@o7c/shared/components/ui/label';
import { Badge } from '@o7c/shared/components/ui/badge';
import { Textarea } from '@o7c/shared/components/ui/textarea';
import { Save, AlertCircle, CheckCircle, Upload, Camera, FileText, GraduationCap, Video, X, Eye } from 'lucide-react';
import { useAuth } from '@o7c/shared';
import { getEffectiveUserRole } from '@o7c/shared/utils/getUserRole';
import { create as createFieldChangeLog } from '@o7c/shared/api/entities/FieldChangeLog';
import { update as updatePlayer } from '@o7c/shared/api/entities/Player';

const PlayerProfileEditor = ({ player, onUpdate }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({});
  const [pendingChanges, setPendingChanges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [uploadingFiles, setUploadingFiles] = useState({});
  const [filePreview, setFilePreview] = useState({});
  const [highlightVideoUrl, setHighlightVideoUrl] = useState('');

  // Editable fields configuration
  const editableFields = [
    { key: 'homeAddress', label: 'Home Address', type: 'text' },
    { key: 'homeCity', label: 'City', type: 'text' },
    { key: 'homeState', label: 'State', type: 'text' },
    { key: 'homeZip', label: 'ZIP Code', type: 'text' },
    { key: 'emailAddress', label: 'Email Address', type: 'email' },
    { key: 'phoneNumber', label: 'Phone Number', type: 'tel' },
    { key: 'alternatePhoneNumber', label: 'Alternate Phone', type: 'tel' },
    { key: 'highSchool', label: 'High School', type: 'text' },
    { key: 'offers', label: 'Number of Offers', type: 'number' },
    { key: 'commitment', label: 'College Commitment', type: 'text' },
    { key: 'height', label: 'Height', type: 'text' },
    { key: 'weight', label: 'Weight', type: 'text' },
    { key: 'position', label: 'Position', type: 'text' },
    { key: 'gpa', label: 'GPA', type: 'number', step: '0.01' },
    { key: 'satScore', label: 'SAT Score', type: 'number' },
    { key: 'actScore', label: 'ACT Score', type: 'number' }
  ];

  useEffect(() => {
    if (player) {
      const initialData = {};
      editableFields.forEach(field => {
        initialData[field.key] = player[field.key] || '';
      });
      setFormData(initialData);
      
      // Initialize highlight video URL
      setHighlightVideoUrl(player.highlightVideoUrl || '');
    }
  }, [player]);

  useEffect(() => {
    const getUserRole = async () => {
      if (user) {
        const role = await getEffectiveUserRole(user);
        setUserRole(role);
      }
    };
    getUserRole();
  }, [user]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // File upload handlers
  const handleFileUpload = async (fileType, file) => {
    if (!file) return;

    // Validate file type and size
    const validationResult = validateFile(fileType, file);
    if (!validationResult.valid) {
      alert(validationResult.error);
      return;
    }

    setUploadingFiles(prev => ({ ...prev, [fileType]: true }));

    try {
      // Create file preview for images
      if (fileType === 'photo' && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setFilePreview(prev => ({ ...prev, [fileType]: e.target.result }));
        };
        reader.readAsDataURL(file);
      }

      // In a real implementation, you would upload to your file storage service
      // For now, we'll simulate the upload and store file metadata
      const fileMetadata = {
        id: `${fileType}_${Date.now()}`,
        playerId: player.id,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        uploadedAt: new Date().toISOString(),
        uploadedBy: user.email,
        category: fileType,
        status: 'uploaded'
      };

      // For profile photos, also update the player's photoUrl field
      let updatedPlayerData = { ...player };

      if (fileType === 'photo') {
        // Create a data URL for the photo that can be used immediately
        const reader = new FileReader();
        const photoUrlPromise = new Promise((resolve) => {
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsDataURL(file);
        });

        const photoUrl = await photoUrlPromise;
        updatedPlayerData.photoUrl = photoUrl;

        // Update player's file tracking
        const updatedFiles = { ...player.profileFiles };
        updatedFiles.photos = updatedFiles.photos || [];
        updatedFiles.photos.push(fileMetadata);
        updatedPlayerData.profileFiles = updatedFiles;

        // Save the updated player data with the new photo URL
        await updatePlayer(player.id, updatedPlayerData);

        // Call onUpdate to refresh the parent component
        if (onUpdate) {
          onUpdate();
        }
      } else if (fileType === 'schoolId') {
        const updatedFiles = { ...player.profileFiles };
        updatedFiles.schoolId = fileMetadata;
        updatedPlayerData.profileFiles = updatedFiles;
        await updatePlayer(player.id, updatedPlayerData);
      } else if (fileType === 'reportCard') {
        const updatedFiles = { ...player.profileFiles };
        updatedFiles.reportCards = updatedFiles.reportCards || [];
        updatedFiles.reportCards.push(fileMetadata);
        updatedPlayerData.profileFiles = updatedFiles;
        await updatePlayer(player.id, updatedPlayerData);
      }

      // Log the file upload as a change
      await logFieldChange(
        `${fileType}Upload`,
        'No file',
        `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`,
        'File Upload'
      );

      alert(`${getFileTypeLabel(fileType)} uploaded successfully!`);

    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file. Please try again.');
    } finally {
      setUploadingFiles(prev => ({ ...prev, [fileType]: false }));
    }
  };

  const validateFile = (fileType, file) => {
    const maxSizes = {
      photo: 5 * 1024 * 1024, // 5MB
      schoolId: 10 * 1024 * 1024, // 10MB
      reportCard: 10 * 1024 * 1024 // 10MB
    };

    const allowedTypes = {
      photo: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      schoolId: ['image/jpeg', 'image/png', 'application/pdf'],
      reportCard: ['image/jpeg', 'image/png', 'application/pdf']
    };

    if (file.size > maxSizes[fileType]) {
      return {
        valid: false,
        error: `File size must be less than ${maxSizes[fileType] / 1024 / 1024}MB`
      };
    }

    if (!allowedTypes[fileType].includes(file.type)) {
      return {
        valid: false,
        error: `Invalid file type. Allowed types: ${allowedTypes[fileType].join(', ')}`
      };
    }

    return { valid: true };
  };

  const getFileTypeLabel = (fileType) => {
    const labels = {
      photo: 'Profile Photo',
      schoolId: 'School ID',
      reportCard: 'Report Card'
    };
    return labels[fileType] || fileType;
  };

  const handleHighlightVideoUpdate = async () => {
    if (!highlightVideoUrl.trim()) {
      alert('Please enter a valid video URL');
      return;
    }

    try {
      await logFieldChange(
        'highlightVideoUrl',
        player.highlightVideoUrl || '',
        highlightVideoUrl,
        'Video Link Update'
      );

      alert('Highlight video URL updated successfully!');
    } catch (error) {
      console.error('Error updating highlight video:', error);
      alert('Error updating highlight video. Please try again.');
    }
  };

  const removeFile = async (fileType, fileId) => {
    if (!confirm('Are you sure you want to remove this file?')) return;

    try {
      await logFieldChange(
        `${fileType}Removal`,
        'File present',
        'File removed',
        'File Removal'
      );

      alert('File removal request submitted for admin review.');
    } catch (error) {
      console.error('Error removing file:', error);
      alert('Error removing file. Please try again.');
    }
  };

  const validateForm = () => {
    const errors = [];
    
    // Email validation
    if (formData.emailAddress && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailAddress)) {
      errors.push('Please enter a valid email address');
    }
    
    // Phone validation (basic)
    if (formData.phoneNumber && !/^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/.test(formData.phoneNumber)) {
      errors.push('Please enter a valid phone number');
    }
    
    // ZIP code validation
    if (formData.homeZip && !/^\d{5}(-\d{4})?$/.test(formData.homeZip)) {
      errors.push('Please enter a valid ZIP code');
    }

    return errors;
  };

  const logFieldChange = async (fieldName, oldValue, newValue, changeType = null) => {
    try {
      await createFieldChangeLog({
        playerId: player.id,
        playerName: `${player.firstName} ${player.lastName}`,
        fieldName,
        oldValue: oldValue || '',
        newValue: newValue || '',
        changeDate: new Date().toISOString(),
        changedBy: user.email,
        changeType: changeType || (userRole === 'player' ? 'Player Update' : 'Parent Update'),
        status: 'Pending Review'
      });
    } catch (error) {
      console.error('Error logging field change:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      alert('Please fix the following errors:\n' + validationErrors.join('\n'));
      return;
    }

    setLoading(true);

    try {
      const changes = [];

      // Compare current data with form data and log changes
      for (const field of editableFields) {
        const oldValue = player[field.key];
        const newValue = formData[field.key];

        if (oldValue !== newValue) {
          await logFieldChange(field.key, oldValue, newValue);
          changes.push({
            field: field.label,
            oldValue,
            newValue
          });
        }
      }

      if (changes.length > 0) {
        // Update the player data immediately in the database
        const updatedPlayerData = { ...player };
        changes.forEach(change => {
          const field = editableFields.find(f => f.label === change.field);
          if (field) {
            updatedPlayerData[field.key] = change.newValue;
          }
        });

        // Save to database
        await updatePlayer(player.id, updatedPlayerData);

        // Add to pending changes for display
        setPendingChanges(prev => [...prev, ...changes]);

        // Call onUpdate to refresh the parent component
        if (onUpdate) {
          onUpdate();
        }

        alert(`Successfully saved ${changes.length} change(s)!\n\nYour profile has been updated.`);

      } else {
        alert('No changes detected.');
      }

    } catch (error) {
      console.error('Error submitting changes:', error);
      alert('Error saving changes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!player) {
    return <div>Loading player data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Pending Changes Alert */}
      {pendingChanges.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <AlertCircle className="h-5 w-5" />
              Pending Changes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-yellow-700 mb-3">
              The following changes are pending admin review:
            </p>
            <div className="space-y-2">
              {pendingChanges.map((change, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{change.field}</span>
                  <Badge variant="secondary">Pending Review</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profile Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle>Edit Profile Information</CardTitle>
          <p className="text-sm text-muted-foreground">
            Update your profile information. Changes will be saved immediately.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {editableFields.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <Label htmlFor={field.key}>{field.label}</Label>
                    <Input
                      id={field.key}
                      type={field.type}
                      step={field.step}
                      value={formData[field.key] || ''}
                      onChange={(e) => handleInputChange(field.key, e.target.value)}
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                    />
                    {/* Show current value for reference */}
                    {player[field.key] && player[field.key] !== formData[field.key] && (
                      <p className="text-xs text-muted-foreground">
                        Current: {player[field.key]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button 
                type="submit" 
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* File Uploads Section */}
      <Card>
        <CardHeader>
          <CardTitle>Documents & Media</CardTitle>
          <p className="text-sm text-muted-foreground">
            Upload your profile photo, school ID, and report cards to maintain a complete recruitment package.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile Photo Upload */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center">
              <Camera className="h-4 w-4 mr-2" />
              Profile Photo
            </h4>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                {filePreview.photo || player.photoUrl ? (
                  <img 
                    src={filePreview.photo || player.photoUrl} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Camera className="h-8 w-8 text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload('photo', e.target.files[0])}
                  disabled={uploadingFiles.photo}
                  className="mb-2"
                />
                <p className="text-xs text-muted-foreground">
                  Upload a clear, professional photo. Max size: 5MB
                </p>
              </div>
              {uploadingFiles.photo && (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              )}
            </div>
          </div>

          {/* School ID Upload */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center">
              <GraduationCap className="h-4 w-4 mr-2" />
              School ID
            </h4>
            <div className="space-y-2">
              <Input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => handleFileUpload('schoolId', e.target.files[0])}
                disabled={uploadingFiles.schoolId}
              />
              <p className="text-xs text-muted-foreground">
                Upload a clear photo or scan of your school ID. Accepted formats: JPG, PNG, PDF. Max size: 10MB
              </p>
              {uploadingFiles.schoolId && (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm">Uploading...</span>
                </div>
              )}
            </div>
          </div>

          {/* Report Card Upload */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Report Cards
            </h4>
            <div className="space-y-2">
              <Input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => handleFileUpload('reportCard', e.target.files[0])}
                disabled={uploadingFiles.reportCard}
              />
              <p className="text-xs text-muted-foreground">
                Upload your latest report card. Regular uploads help maintain a strong recruitment package. 
                Accepted formats: JPG, PNG, PDF. Max size: 10MB
              </p>
              {uploadingFiles.reportCard && (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm">Uploading...</span>
                </div>
              )}
            </div>
          </div>

          {/* Highlight Video */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center">
              <Video className="h-4 w-4 mr-2" />
              Highlight Video
            </h4>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  type="url"
                  value={highlightVideoUrl}
                  onChange={(e) => setHighlightVideoUrl(e.target.value)}
                  placeholder="Enter YouTube, Vimeo, or other video URL"
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={handleHighlightVideoUpdate}
                  disabled={!highlightVideoUrl.trim()}
                  variant="outline"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Update
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Add a link to your highlight video to showcase your skills to recruiters.
              </p>
              {player.highlightVideoUrl && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Eye className="h-4 w-4" />
                  <span>Current: {player.highlightVideoUrl}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Profile Update Information</p>
              <ul className="space-y-1 text-blue-700">
                <li>• Changes are saved immediately to your profile</li>
                <li>• All updates are logged for security and tracking</li>
                <li>• Contact support if you need help with updates</li>
                <li>• Keep your information current for better recruitment opportunities</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlayerProfileEditor;