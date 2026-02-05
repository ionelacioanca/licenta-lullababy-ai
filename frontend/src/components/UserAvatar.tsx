import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface UserAvatarProps {
  profilePicture?: string | null;
  userName: string;
  size?: number;
  backgroundColor?: string;
  textColor?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({
  profilePicture,
  userName,
  size = 40,
  backgroundColor = '#A2E884',
  textColor = '#FFF',
}) => {
  const getInitials = (name: string) => {
    const names = name.trim().split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const API_URL = "http://192.168.1.20:5000";

  if (profilePicture) {
    const imageUri = profilePicture.startsWith('http') 
      ? profilePicture 
      : `${API_URL}${profilePicture}`;
      
    return (
      <Image
        source={{ uri: imageUri }}
        style={[
          styles.avatar,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.avatarPlaceholder,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
        },
      ]}
    >
      <Text
        style={[
          styles.initialsText,
          {
            color: textColor,
            fontSize: size / 2.5,
          },
        ]}
      >
        {getInitials(userName)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    resizeMode: 'cover',
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    fontWeight: 'bold',
  },
});

export default UserAvatar;
