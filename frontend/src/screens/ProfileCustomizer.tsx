import React, { useState, useEffect } from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Alert, Dimensions, Image, Linking,
} from 'react-native';
import ImagePicker from 'react-native-image-crop-picker';
import axios from 'axios';
import UUID from 'react-native-uuid';

// Assuming CustomizationWidget is defined similarly in ProfileScreen.tsx or a shared types file
// Re-defining here for clarity in this file, ideally it's in a shared types file.
export interface CustomizationWidget {
  id: string;
  type: 'profileCard' | 'about' | 'healthSummary' | 'posts' | 'customText' | 'image' | 'link' | 'socialMedia' | 'calendar' | 'quote' | 'contactInfo' | 'progressBar' | 'countdown' | 'gallery' | 'map' | 'divider' | string; // Added 'divider'
  position: { x: number; y: number };
  size?: { width: number; height: number }; // size is already here
  config?: any; // For color, style if needed
}

const { width: screenWidth } = Dimensions.get('window');

interface ProfileCustomizerModalProps {
  visible: boolean;
  backgroundUrl: string | null;
  widgets: CustomizationWidget[];
  onClose: () => void;
  onSave: (backgroundUrl: string | null, newWidgets: CustomizationWidget[]) => void;
  profileData: {
    nickname: string;
    about: string;
    healthInfo: any;
    posts: any[];
    imageUrl: string | null;
    joinText: string;
    followerCount: number;
    followingCount: number;
  };
  findNextWidgetPosition: (currentWidgets: CustomizationWidget[], newWidgetHeight: number, newWidgetWidth?: number) => { x: number; y: number };
}

const ProfileCustomizerModal: React.FC<ProfileCustomizerModalProps> = ({
  visible, backgroundUrl, widgets, onClose, onSave, profileData, findNextWidgetPosition
}) => {
  const [currentBackgroundUrl, setCurrentBackgroundUrl] = useState<string | null>(backgroundUrl);
  const [currentWidgets, setCurrentWidgets] = useState<CustomizationWidget[]>(widgets);
  const [initialWidgets, setInitialWidgets] = useState<CustomizationWidget[]>([]);

  // State for new widget inputs
  const [newCustomText, setNewCustomText] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [newQuoteText, setNewQuoteText] = useState('');
  const [newQuoteAuthor, setNewQuoteAuthor] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactWebsite, setNewContactWebsite] = useState('');
  const [newProgressBarLabel, setNewProgressBarLabel] = useState('');
  const [newProgressBarValue, setNewProgressBarValue] = useState('50'); // Default to 50%

  const [newSocialLinks, setNewSocialLinks] = useState({
    instagram: '',
    twitter: '',
    facebook: '',
    linkedin: '',
    youtube: '',
    tiktok: '',
  });

  useEffect(() => {
    setCurrentBackgroundUrl(backgroundUrl);
    // Ensure widgets is an array, even if null/undefined
    setCurrentWidgets(widgets || []);
    if (visible) {
      // Deep copy initial widgets to allow for a true reset
      setInitialWidgets(widgets ? JSON.parse(JSON.stringify(widgets)) : []);
    }
    // Reset all input fields when modal opens/closes
    setNewCustomText('');
    setNewImageUrl('');
    setNewLinkUrl('');
    setNewLinkLabel('');
    setNewQuoteText('');
    setNewQuoteAuthor('');
    setNewContactEmail('');
    setNewContactPhone('');
    setNewContactWebsite('');
    setNewProgressBarLabel('');
    setNewProgressBarValue('50');
    setNewSocialLinks({ instagram: '', twitter: '', facebook: '', linkedin: '', youtube: '', tiktok: '' });
  }, [visible, backgroundUrl, widgets]);

  const handleSelectImage = async (setImageUrlState: React.Dispatch<React.SetStateAction<string>>) => {
    try {
      const image = await ImagePicker.openPicker({
        mediaType: 'photo',
        cropping: true,
        cropperStatusBarColor: '#4387E5',
        cropperToolbarColor: '#4387E5',
      });
      // For a real app, you'd upload this image and get a public URL.
      // For now, we'll use the local path.
      setImageUrlState(image.path);
      Alert.alert('Image Selected', 'Image selected from gallery. Remember to upload it to a server for persistence!');
    } catch (e) {
      console.log('Image selection cancelled or error:', e);
    }
  };

  const handleSelectBackgroundImage = async () => {
    try {
      const image = await ImagePicker.openPicker({
        mediaType: 'photo',
        cropping: true,
        cropperStatusBarColor: '#4387E5',
        cropperToolbarColor: '#4387E5',
      });

      Alert.alert(
        'Upload Image',
        'Do you want to upload this image to the server?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Upload',
            onPress: async () => {
              try {
                const formData = new FormData();
                formData.append('file', {
                  uri: image.path,
                  type: image.mime,
                  name: image.path.split('/').pop(),
                });

                // Replace with your actual upload endpoint
                const uploadRes = await axios.post('https://mycarering.loca.lt/upload/image', formData, {
                  headers: {
                    'Content-Type': 'multipart/form-data',
                    // Authorization token if needed for upload
                  },
                });
                setCurrentBackgroundUrl(`https://mycarering.loca.lt${uploadRes.data.file_path}`);
                Alert.alert('Success', 'Background image uploaded and set.');
              } catch (uploadError) {
                console.error('Error uploading image:', uploadError);
                Alert.alert('Upload Failed', 'Could not upload image. Please try again.');
                setCurrentBackgroundUrl(image.path); // Fallback to local path for immediate preview
              }
            },
          },
        ]
      );
    } catch (e) {
      console.log('Image selection cancelled or error:', e);
    }
  };

  const handleAddWidget = (type: CustomizationWidget['type']) => {
    let newWidget: CustomizationWidget;
    const defaultWidth = screenWidth - 40; // Default width for new widgets
    let defaultHeight = 150; // Default height, will be adjusted per type

    const existingWidgetIds = new Set(currentWidgets.map(w => w.id));

    // Common check for fixed widgets (only one instance allowed)
    const isFixedWidget = ['profileCard', 'about', 'healthSummary', 'posts'].includes(type);
    if (isFixedWidget && existingWidgetIds.has(type)) {
      Alert.alert('Already Exists', `${type.replace(/([A-Z])/g, ' $1').trim()} widget is already on your profile.`);
      return;
    }

    switch (type) {
      case 'profileCard':
        defaultHeight = 250;
        newWidget = {
          id: 'profileCard',
          type: 'profileCard',
          position: findNextWidgetPosition(currentWidgets, defaultHeight, defaultWidth),
          size: { width: defaultWidth, height: defaultHeight },
          config: {
            nickname: profileData.nickname,
            joinText: profileData.joinText,
            imageUrl: profileData.imageUrl,
            followerCount: profileData.followerCount,
            followingCount: profileData.followingCount
          }
        };
        break;
      case 'about':
        defaultHeight = 150;
        newWidget = {
          id: 'about',
          type: 'about',
          position: findNextWidgetPosition(currentWidgets, defaultHeight, defaultWidth),
          size: { width: defaultWidth, height: defaultHeight },
          config: { text: profileData.about }
        };
        break;
      case 'healthSummary':
        defaultHeight = 200;
        newWidget = {
          id: 'healthSummary',
          type: 'healthSummary',
          position: findNextWidgetPosition(currentWidgets, defaultHeight, defaultWidth),
          size: { width: defaultWidth, height: defaultHeight },
          config: { data: profileData.healthInfo }
        };
        break;
      case 'posts':
        defaultHeight = 300;
        newWidget = {
          id: 'posts',
          type: 'posts',
          position: findNextWidgetPosition(currentWidgets, defaultHeight, defaultWidth),
          size: { width: defaultWidth, height: defaultHeight },
          config: { posts: profileData.posts }
        };
        break;
      case 'customText':
        defaultHeight = 100;
        newWidget = {
          id: `customText-${UUID.v4()}`,
          type: 'customText',
          position: findNextWidgetPosition(currentWidgets, defaultHeight, defaultWidth),
          size: { width: defaultWidth, height: defaultHeight },
          config: { text: newCustomText || 'New Custom Text' }
        };
        setNewCustomText(''); // Clear input
        break;
      case 'image':
        defaultHeight = 200;
        newWidget = {
          id: `image-${UUID.v4()}`,
          type: 'image',
          position: findNextWidgetPosition(currentWidgets, defaultHeight, defaultWidth),
          size: { width: defaultWidth, height: defaultHeight },
          config: { imageUrl: newImageUrl || 'https://via.placeholder.com/150' } // Placeholder
        };
        setNewImageUrl(''); // Clear input
        break;
      case 'link':
        defaultHeight = 100;
        newWidget = {
          id: `link-${UUID.v4()}`,
          type: 'link',
          position: findNextWidgetPosition(currentWidgets, defaultHeight, defaultWidth),
          size: { width: defaultWidth, height: defaultHeight },
          config: { url: newLinkUrl || 'https://example.com', label: newLinkLabel || 'New Link' }
        };
        setNewLinkUrl('');
        setNewLinkLabel('');
        break;
      case 'socialMedia':
        defaultHeight = 150;
        newWidget = {
          id: `socialMedia-${UUID.v4()}`,
          type: 'socialMedia',
          position: findNextWidgetPosition(currentWidgets, defaultHeight, defaultWidth),
          size: { width: defaultWidth, height: defaultHeight },
          config: { socialLinks: { ...newSocialLinks } }
        };
        setNewSocialLinks({ instagram: '', twitter: '', facebook: '', linkedin: '', youtube: '', tiktok: '' });
        break;
      case 'calendar':
        defaultHeight = 150;
        newWidget = {
          id: `calendar-${UUID.v4()}`,
          type: 'calendar',
          position: findNextWidgetPosition(currentWidgets, defaultHeight, defaultWidth),
          size: { width: defaultWidth, height: defaultHeight },
          config: {} // No specific config for now
        };
        break;
      case 'quote':
        defaultHeight = 120;
        newWidget = {
          id: `quote-${UUID.v4()}`,
          type: 'quote',
          position: findNextWidgetPosition(currentWidgets, defaultHeight, defaultWidth),
          size: { width: defaultWidth, height: defaultHeight },
          config: { text: newQuoteText || 'Be the change you wish to see in the world.', author: newQuoteAuthor || 'Anonymous' }
        };
        setNewQuoteText('');
        setNewQuoteAuthor('');
        break;
      case 'contactInfo':
        defaultHeight = 180;
        newWidget = {
          id: `contactInfo-${UUID.v4()}`,
          type: 'contactInfo',
          position: findNextWidgetPosition(currentWidgets, defaultHeight, defaultWidth),
          size: { width: defaultWidth, height: defaultHeight },
          config: {
            email: newContactEmail || 'your.email@example.com',
            phone: newContactPhone || '+1234567890',
            website: newContactWebsite || 'https://yourwebsite.com'
          }
        };
        setNewContactEmail('');
        setNewContactPhone('');
        setNewContactWebsite('');
        break;
      case 'progressBar':
        defaultHeight = 100;
        newWidget = {
          id: `progressBar-${UUID.v4()}`,
          type: 'progressBar',
          position: findNextWidgetPosition(currentWidgets, defaultHeight, defaultWidth),
          size: { width: defaultWidth, height: defaultHeight },
          config: { label: newProgressBarLabel || 'Progress', value: parseInt(newProgressBarValue) || 50 }
        };
        setNewProgressBarLabel('');
        setNewProgressBarValue('50');
        break;
      case 'countdown':
        defaultHeight = 100;
        newWidget = {
          id: `countdown-${UUID.v4()}`,
          type: 'countdown',
          position: findNextWidgetPosition(currentWidgets, defaultHeight, defaultWidth),
          size: { width: defaultWidth, height: defaultHeight },
          config: {
            // Example default: 7 days from now
            targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            label: 'Upcoming Event'
          }
        };
        Alert.alert('Countdown Widget Added', 'Remember to set the target date and label in the widget config on your profile screen!');
        break;
      case 'gallery':
        defaultHeight = 250;
        newWidget = {
          id: `gallery-${UUID.v4()}`,
          type: 'gallery',
          position: findNextWidgetPosition(currentWidgets, defaultHeight, defaultWidth),
          size: { width: defaultWidth, height: defaultHeight },
          config: { images: [] } // User will add images later
        };
        Alert.alert('Gallery Widget Added', 'You can add images to your gallery directly on the profile screen.');
        break;
      case 'map':
        defaultHeight = 250;
        newWidget = {
          id: `map-${UUID.v4()}`,
          type: 'map',
          position: findNextWidgetPosition(currentWidgets, defaultHeight, defaultWidth),
          size: { width: defaultWidth, height: defaultHeight },
          config: {
            latitude: 37.7749, // Default to San Francisco
            longitude: -122.4194,
            label: 'My Location'
          }
        };
        Alert.alert('Map Widget Added', 'Customize the location and label directly on your profile screen.');
        break;
      case 'divider': // New case for divider
        defaultHeight = 5; // Default thickness (height) for the divider
        newWidget = {
          id: `divider-${UUID.v4()}`,
          type: 'divider',
          position: findNextWidgetPosition(currentWidgets, defaultHeight, defaultWidth),
          size: { width: defaultWidth, height: defaultHeight },
          config: { color: '#ccc' } // Default color, can be made configurable later
        };
        break;
      default:
        console.warn('Attempted to add unknown widget type:', type);
        return;
    }
    setCurrentWidgets(prev => [...prev, newWidget]);
  };

  const handleSave = () => {
    onSave(currentBackgroundUrl, currentWidgets);
  };

  const handleReset = () => {
    Alert.alert(
      'Reset Layout',
      'Are you sure you want to reset all widgets to their original state? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive', // Indicate a destructive action
          onPress: () => {
            setCurrentWidgets(initialWidgets); // Reset to the stored initial state
            setCurrentBackgroundUrl(backgroundUrl); // Also reset background if it changed
            Alert.alert('Layout Reset', 'Your layout has been reset to its original state.');
          },
        },
      ]
    );
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={modalStyles.centeredView}>
        <View style={modalStyles.modalView}>
          <Text style={modalStyles.modalTitle}>Customize Your Profile</Text>
          <ScrollView style={modalStyles.scrollView}>

            {/* Background Image Section */}
            <View style={modalStyles.section}>
              <Text style={modalStyles.sectionHeader}>Background Image</Text>
              <TouchableOpacity style={modalStyles.actionButton} onPress={handleSelectBackgroundImage}>
                <Text style={modalStyles.actionButtonText}>Choose Background Image</Text>
              </TouchableOpacity>
              {currentBackgroundUrl && (
                <View style={modalStyles.imagePreviewContainer}>
                  <Image source={{ uri: currentBackgroundUrl }} style={modalStyles.imagePreview} />
                  <TouchableOpacity
                    style={modalStyles.removeImageButton}
                    onPress={() => setCurrentBackgroundUrl(null)}
                  >
                    <Text style={modalStyles.removeImageButtonText}>Remove Background</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Existing Widgets Section - Non-interactable here, for visual reference */}
            <View style={modalStyles.section}>
              <Text style={modalStyles.sectionHeader}>Current Widgets on Profile</Text>
              {currentWidgets.length === 0 ? (
                <Text style={modalStyles.infoText}>No widgets added yet. Add some below!</Text>
              ) : (
                <View style={modalStyles.currentWidgetsList}>
                  {currentWidgets.map(widget => (
                    <View key={widget.id} style={modalStyles.currentWidgetItem}>
                      <Text style={modalStyles.currentWidgetText}>
                        {widget.type.replace(/([A-Z])/g, ' $1').trim()}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
              <Text style={modalStyles.hintText}>Drag, resize, and configure widgets directly on your profile screen.</Text>
            </View>

            {/* Add Essential Widgets Section */}
            <View style={modalStyles.section}>
              <Text style={modalStyles.sectionHeader}>Add Essential Widgets</Text>
              <View style={modalStyles.widgetAddButtons}>
                {/* Check if widget type exists before rendering add button */}
                {!currentWidgets.some(w => w.type === 'profileCard') && (
                  <TouchableOpacity style={modalStyles.addWidgetButton} onPress={() => handleAddWidget('profileCard')}>
                    <Text style={modalStyles.addWidgetButtonText}>+ Profile Card</Text>
                  </TouchableOpacity>
                )}
                {!currentWidgets.some(w => w.type === 'about') && (
                  <TouchableOpacity style={modalStyles.addWidgetButton} onPress={() => handleAddWidget('about')}>
                    <Text style={modalStyles.addWidgetButtonText}>+ About Me</Text>
                  </TouchableOpacity>
                )}
                {!currentWidgets.some(w => w.type === 'healthSummary') && (
                  <TouchableOpacity style={modalStyles.addWidgetButton} onPress={() => handleAddWidget('healthSummary')}>
                    <Text style={modalStyles.addWidgetButtonText}>+ Health Info</Text>
                  </TouchableOpacity>
                )}
                {!currentWidgets.some(w => w.type === 'posts') && (
                  <TouchableOpacity style={modalStyles.addWidgetButton} onPress={() => handleAddWidget('posts')}>
                    <Text style={modalStyles.addWidgetButtonText}>+ Posts</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Add Custom Widgets Section */}
            <View style={modalStyles.section}>
              <Text style={modalStyles.sectionHeader}>Add More Widgets</Text>

              {/* Custom Text Widget */}
              <View style={modalStyles.widgetInputGroup}>
                <Text style={modalStyles.inputLabel}>Custom Text Widget</Text>
                <TextInput
                  style={modalStyles.textInput}
                  placeholder="Enter your custom text here..."
                  placeholderTextColor="#999"
                  value={newCustomText}
                  onChangeText={setNewCustomText}
                  multiline
                  maxLength={500}
                />
                <TouchableOpacity
                  style={[modalStyles.addWidgetButtonFull, !newCustomText.trim() && modalStyles.disabledButton]}
                  onPress={() => handleAddWidget('customText')}
                  disabled={!newCustomText.trim()}
                >
                  <Text style={modalStyles.addWidgetButtonText}>Add Custom Text</Text>
                </TouchableOpacity>
              </View>

              {/* Image Widget */}
              <View style={modalStyles.widgetInputGroup}>
                <Text style={modalStyles.inputLabel}>Image Widget</Text>
                <TextInput
                  style={modalStyles.textInput}
                  placeholder="Enter image URL (e.g., https://example.com/pic.jpg)"
                  placeholderTextColor="#999"
                  value={newImageUrl}
                  onChangeText={setNewImageUrl}
                  keyboardType="url"
                  autoCapitalize="none"
                />
                <TouchableOpacity style={modalStyles.actionButton} onPress={() => handleSelectImage(setNewImageUrl)}>
                  <Text style={modalStyles.actionButtonText}>Select Image from Gallery</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[modalStyles.addWidgetButtonFull, { marginTop: 10 }, !newImageUrl.trim() && modalStyles.disabledButton]}
                  onPress={() => handleAddWidget('image')}
                  disabled={!newImageUrl.trim()}
                >
                  <Text style={modalStyles.addWidgetButtonText}>Add Image</Text>
                </TouchableOpacity>
              </View>

              {/* Link Widget */}
              <View style={modalStyles.widgetInputGroup}>
                <Text style={modalStyles.inputLabel}>Link Widget</Text>
                <TextInput
                  style={modalStyles.textInput}
                  placeholder="https://example.com"
                  placeholderTextColor="#999"
                  value={newLinkUrl}
                  onChangeText={setNewLinkUrl}
                  keyboardType="url"
                  autoCapitalize="none"
                />
                <TextInput
                  style={modalStyles.textInput}
                  placeholder="Link Label (e.g., My Portfolio)"
                  placeholderTextColor="#999"
                  value={newLinkLabel}
                  onChangeText={setNewLinkLabel}
                />
                <TouchableOpacity
                  style={[modalStyles.addWidgetButtonFull, !newLinkUrl.trim() && modalStyles.disabledButton]}
                  onPress={() => handleAddWidget('link')}
                  disabled={!newLinkUrl.trim()}
                >
                  <Text style={modalStyles.addWidgetButtonText}>Add Link</Text>
                </TouchableOpacity>
              </View>

              {/* Social Media Widget */}
              <View style={modalStyles.widgetInputGroup}>
                <Text style={modalStyles.inputLabel}>Social Media Links Widget</Text>
                {Object.keys(newSocialLinks).map(platform => (
                  <View key={platform} style={modalStyles.socialInputRow}>
                    <Text style={modalStyles.socialInputLabel}>{platform.charAt(0).toUpperCase() + platform.slice(1)} URL:</Text>
                    <TextInput
                      style={modalStyles.socialTextInput}
                      placeholder={`Enter ${platform} profile URL`}
                      placeholderTextColor="#999"
                      value={newSocialLinks[platform as keyof typeof newSocialLinks]}
                      onChangeText={(text) => setNewSocialLinks(prev => ({ ...prev, [platform]: text }))}
                      keyboardType="url"
                      autoCapitalize="none"
                    />
                  </View>
                ))}
                <TouchableOpacity
                  style={modalStyles.addWidgetButtonFull}
                  onPress={() => handleAddWidget('socialMedia')}
                >
                  <Text style={modalStyles.addWidgetButtonText}>Add Social Media</Text>
                </TouchableOpacity>
              </View>

              {/* Quote Widget */}
              <View style={modalStyles.widgetInputGroup}>
                <Text style={modalStyles.inputLabel}>Quote Widget</Text>
                <TextInput
                  style={modalStyles.textInput}
                  placeholder="Enter the quote text"
                  placeholderTextColor="#999"
                  value={newQuoteText}
                  onChangeText={setNewQuoteText}
                  multiline
                />
                <TextInput
                  style={modalStyles.textInput}
                  placeholder="Author (Optional)"
                  placeholderTextColor="#999"
                  value={newQuoteAuthor}
                  onChangeText={setNewQuoteAuthor}
                />
                <TouchableOpacity
                  style={[modalStyles.addWidgetButtonFull, !newQuoteText.trim() && modalStyles.disabledButton]}
                  onPress={() => handleAddWidget('quote')}
                  disabled={!newQuoteText.trim()}
                >
                  <Text style={modalStyles.addWidgetButtonText}>Add Quote</Text>
                </TouchableOpacity>
              </View>

              {/* Contact Info Widget */}
              <View style={modalStyles.widgetInputGroup}>
                <Text style={modalStyles.inputLabel}>Contact Info Widget</Text>
                <TextInput
                  style={modalStyles.textInput}
                  placeholder="Email"
                  placeholderTextColor="#999"
                  value={newContactEmail}
                  onChangeText={setNewContactEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <TextInput
                  style={modalStyles.textInput}
                  placeholder="Phone (e.g., +1 234 567 8900)"
                  placeholderTextColor="#999"
                  value={newContactPhone}
                  onChangeText={setNewContactPhone}
                  keyboardType="phone-pad"
                />
                <TextInput
                  style={modalStyles.textInput}
                  placeholder="Website URL"
                  placeholderTextColor="#999"
                  value={newContactWebsite}
                  onChangeText={setNewContactWebsite}
                  keyboardType="url"
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={modalStyles.addWidgetButtonFull}
                  onPress={() => handleAddWidget('contactInfo')}
                >
                  <Text style={modalStyles.addWidgetButtonText}>Add Contact Info</Text>
                </TouchableOpacity>
              </View>

              {/* Progress Bar Widget */}
              <View style={modalStyles.widgetInputGroup}>
                <Text style={modalStyles.inputLabel}>Progress Bar Widget</Text>
                <TextInput
                  style={modalStyles.textInput}
                  placeholder="Progress Label (e.g., Goal Achieved)"
                  placeholderTextColor="#999"
                  value={newProgressBarLabel}
                  onChangeText={setNewProgressBarLabel}
                />
                <TextInput
                  style={modalStyles.textInput}
                  placeholder="Value (0-100)"
                  placeholderTextColor="#999"
                  value={newProgressBarValue}
                  onChangeText={(text) => setNewProgressBarValue(text.replace(/[^0-9]/g, ''))} // Only allow numbers
                  keyboardType="numeric"
                  maxLength={3}
                />
                <TouchableOpacity
                  style={[modalStyles.addWidgetButtonFull, !newProgressBarLabel.trim() && modalStyles.disabledButton]}
                  onPress={() => handleAddWidget('progressBar')}
                  disabled={!newProgressBarLabel.trim() || parseInt(newProgressBarValue) < 0 || parseInt(newProgressBarValue) > 100}
                >
                  <Text style={modalStyles.addWidgetButtonText}>Add Progress Bar</Text>
                </TouchableOpacity>
              </View>

              {/* Calendar Widget */}
              <View style={modalStyles.widgetInputGroup}>
                <Text style={modalStyles.inputLabel}>Calendar Widget</Text>
                <TouchableOpacity style={modalStyles.addWidgetButtonFull} onPress={() => handleAddWidget('calendar')}>
                  <Text style={modalStyles.addWidgetButtonText}>Add Calendar</Text>
                </TouchableOpacity>
              </View>

              {/* Countdown Widget */}
              <View style={modalStyles.widgetInputGroup}>
                <Text style={modalStyles.inputLabel}>Countdown Widget</Text>
                <Text style={modalStyles.infoText}>Target date and label can be set on the profile screen after adding.</Text>
                <TouchableOpacity style={modalStyles.addWidgetButtonFull} onPress={() => handleAddWidget('countdown')}>
                  <Text style={modalStyles.addWidgetButtonText}>Add Countdown</Text>
                </TouchableOpacity>
              </View>

              {/* Gallery Widget */}
              <View style={modalStyles.widgetInputGroup}>
                <Text style={modalStyles.inputLabel}>Image Gallery Widget</Text>
                <Text style={modalStyles.infoText}>Add images to your gallery directly on the profile screen.</Text>
                <TouchableOpacity style={modalStyles.addWidgetButtonFull} onPress={() => handleAddWidget('gallery')}>
                  <Text style={modalStyles.addWidgetButtonText}>Add Gallery</Text>
                </TouchableOpacity>
              </View>

              {/* Map Widget */}
              <View style={modalStyles.widgetInputGroup}>
                <Text style={modalStyles.inputLabel}>Map Widget</Text>
                <Text style={modalStyles.infoText}>Set location and label directly on your profile screen.</Text>
                <TouchableOpacity style={modalStyles.addWidgetButtonFull} onPress={() => handleAddWidget('map')}>
                  <Text style={modalStyles.addWidgetButtonText}>Add Map</Text>
                </TouchableOpacity>
              </View>

              {/* NEW: Divider Widget */}
              <View style={modalStyles.widgetInputGroup}>
                <Text style={modalStyles.inputLabel}>Divider (Underline) Widget</Text>
                <Text style={modalStyles.infoText}>A customizable line to separate sections. Adjust its thickness on the profile screen.</Text>
                <TouchableOpacity style={modalStyles.addWidgetButtonFull} onPress={() => handleAddWidget('divider')}>
                  <Text style={modalStyles.addWidgetButtonText}>Add Divider</Text>
                </TouchableOpacity>
              </View>

            </View>

          </ScrollView>

          {/* Action Buttons */}
          <View style={modalStyles.bottomButtonContainer}>
            <TouchableOpacity style={[modalStyles.actionButton, modalStyles.cancelButton]} onPress={onClose}>
              <Text style={modalStyles.actionButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[modalStyles.actionButton, modalStyles.resetButton]} onPress={handleReset}>
              <Text style={modalStyles.actionButtonText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[modalStyles.actionButton, modalStyles.saveButton]} onPress={handleSave}>
              <Text style={modalStyles.actionButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const modalStyles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: screenWidth * 0.9,
    maxHeight: '90%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#4387E5',
  },
  scrollView: {
    width: '100%',
  },
  section: {
    marginBottom: 20,
    width: '100%',
    paddingBottom: 15, // Add some padding below each section
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  actionButton: {
    backgroundColor: '#4387E5',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  imagePreviewContainer: {
    marginTop: 10,
    alignItems: 'center',
  },
  imagePreview: {
    width: '100%',
    height: 150,
    borderRadius: 10,
    resizeMode: 'cover',
    marginBottom: 10,
  },
  removeImageButton: {
    backgroundColor: '#dc3545',
    padding: 8,
    borderRadius: 5,
  },
  removeImageButtonText: {
    color: 'white',
    fontSize: 12,
  },
  infoText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 10,
    textAlign: 'center',
  },
  currentWidgetsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 10,
  },
  currentWidgetItem: {
    backgroundColor: '#e9ecef',
    borderRadius: 15,
    paddingVertical: 5,
    paddingHorizontal: 10,
    margin: 5,
  },
  currentWidgetText: {
    fontSize: 12,
    color: '#495057',
  },
  hintText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 5,
  },
  widgetAddButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 10,
  },
  addWidgetButton: {
    backgroundColor: '#28a745', // Green for add
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    margin: 5,
  },
  addWidgetButtonFull: {
    backgroundColor: '#28a745',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  addWidgetButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  widgetInputGroup: {
    width: '100%',
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e2e6ea',
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
    color: '#495057',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    fontSize: 14,
    color: '#333',
    backgroundColor: 'white',
  },
  socialInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  socialInputLabel: {
    fontSize: 13,
    color: '#555',
    width: 80, // Fixed width for labels
  },
  socialTextInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    padding: 8,
    fontSize: 13,
    color: '#333',
    backgroundColor: 'white',
  },
  disabledButton: {
    backgroundColor: '#a9d9b7', // Lighter green when disabled
  },
  bottomButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
  },
  cancelButton: {
    backgroundColor: '#6c757d', // Grey
    flex: 1,
    marginRight: 5,
  },
  resetButton: {
    backgroundColor: '#ffc107', // Warning yellow
    flex: 1,
    marginHorizontal: 5,
  },
  saveButton: {
    backgroundColor: '#4387E5', // Primary blue
    flex: 1,
    marginLeft: 5,
  },
});

export default ProfileCustomizerModal;