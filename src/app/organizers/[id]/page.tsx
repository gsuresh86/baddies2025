'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { tournamentStore } from '@/lib/store';
import AuthGuard from '@/components/AuthGuard';
import { useToast } from '@/contexts/ToastContext';
import { Organizer } from '@/types';

export default function OrganizerUploadPage() {
  const params = useParams();
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const organizerId = params.id as string;
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [role, setRole] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [organizer, setOrganizer] = useState<Organizer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrganizer() {
      try {
        setLoading(true);
        // Try to get organizer from database first
        const dbOrganizer = await tournamentStore.getOrganizerById(organizerId);
        if (dbOrganizer) {
          setOrganizer(dbOrganizer);
          setRole(dbOrganizer.role || '');
        }
      } catch (error) {
        console.error('Error loading organizer:', error);
        showError('Organizer not found');
        router.push('/organizers');
      } finally {
        setLoading(false);
      }
    }
    loadOrganizer();
  }, [organizerId, router, showError]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showError('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showError('File size must be less than 5MB');
        return;
      }

      setSelectedFile(file);
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !organizer) {
      showError('Please select a file and organizer');
      return;
    }

    setIsUploading(true);

    try {
      // Upload image using the store function
      const { url, path } = await tournamentStore.uploadOrganizerImage(organizerId, selectedFile);
      
      // Update organizer in database
      await tournamentStore.updateOrganizer(organizerId, {
        image_url: url,
        image_path: path
      });
      
      showSuccess('Image uploaded successfully!');
      
      // Reset form
      setSelectedFile(null);
      setPreviewUrl('');
      
      // Redirect back to organizers page after a short delay
      setTimeout(() => {
        router.push('/organizers');
      }, 2000);

    } catch (error) {
      console.error('Upload error:', error);
      showError('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRoleUpdate = async () => {
    if (!role.trim() || !organizer) {
      showError('Please enter a role');
      return;
    }

    setIsUploading(true);

    try {
      // Update organizer role in database
      await tournamentStore.updateOrganizer(organizerId, {
        role: role.trim()
      });
      showSuccess('Role updated successfully!');
      
      // Redirect back to organizers page after a short delay
      setTimeout(() => {
        router.push('/organizers');
      }, 2000);

    } catch (error) {
      console.error('Role update error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  if (loading || !organizer) {
    return (
      <AuthGuard>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading organizer...</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              📸 Upload Organizer Image
            </h1>
            <p className="text-xl text-gray-300">
              Update image and role for {organizer.name}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Current Organizer Info */}
            <div className="bg-black/40 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6">Current Information</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Organizer Name
                  </label>
                  <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-600">
                    <p className="text-white text-lg font-medium">{organizer.name}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Current Role
                  </label>
                  <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-600">
                    <p className="text-green-400 text-lg font-medium">
                      {organizer.role || 'No role assigned'}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Current Image
                  </label>
                  <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-600">
                    {organizer.image_url ? (
                      <div className="space-y-2">
                        <img
                          src={organizer.image_url}
                          alt={organizer.name}
                          className="w-32 h-32 object-cover rounded-full mx-auto border-4 border-green-400"
                        />
                        <p className="text-green-400 text-center text-sm">Uploaded Image</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="w-32 h-32 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto">
                          <span className="text-4xl font-bold text-white">
                            {organizer.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <p className="text-gray-400 text-center text-sm">Placeholder Image</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Upload Form */}
            <div className="bg-black/40 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6">Update Information</h2>
              
              <div className="space-y-6">
                {/* Image Upload */}
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Upload New Image
                  </label>
                  <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-green-400 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload" className="cursor-pointer">
                      {previewUrl ? (
                        <div className="space-y-4">
                          <img
                            src={previewUrl}
                            alt="Preview"
                            className="w-32 h-32 object-cover rounded-full mx-auto border-4 border-green-400"
                          />
                          <p className="text-green-400 text-sm">Image selected</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-white font-medium">Click to upload image</p>
                            <p className="text-gray-400 text-sm">PNG, JPG up to 5MB</p>
                          </div>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                {/* Role Input */}
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Update Role
                  </label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="Enter organizer role..."
                    className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-green-400 transition-colors"
                  />
                </div>

                {/* Action Buttons */}
                <div className="space-y-4">
                  {selectedFile && (
                    <button
                      onClick={handleUpload}
                      disabled={isUploading}
                      className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white font-bold py-3 px-6 rounded-lg hover:from-green-600 hover:to-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUploading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Uploading...
                        </div>
                      ) : (
                        'Upload Image'
                      )}
                    </button>
                  )}

                  {role.trim() && role !== organizer.role && (
                    <button
                      onClick={handleRoleUpdate}
                      disabled={isUploading}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 px-6 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUploading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Updating...
                        </div>
                      ) : (
                        'Update Role'
                      )}
                    </button>
                  )}

                  <button
                    onClick={() => router.push('/organizers')}
                    className="w-full bg-gray-700 text-white font-bold py-3 px-6 rounded-lg hover:bg-gray-600 transition-all duration-200"
                  >
                    Back to Organizers
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-8 bg-black/40 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">📋 Instructions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300">
              <div>
                <h4 className="font-semibold text-green-400 mb-2">Image Requirements:</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Supported formats: PNG, JPG, JPEG</li>
                  <li>• Maximum file size: 5MB</li>
                  <li>• Recommended size: 400x400 pixels</li>
                  <li>• Square aspect ratio preferred</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-blue-400 mb-2">Role Guidelines:</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Keep roles concise and clear</li>
                  <li>• Examples: Tournament Director, Event Coordinator</li>
                  <li>• Avoid special characters</li>
                  <li>• Maximum 50 characters</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
} 