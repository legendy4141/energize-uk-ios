import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ImageBackground, ActivityIndicator, Keyboard, Alert } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import LoadingFrame from '../components/LoadingFrame';
import axios from 'axios';

// Define the navigation prop type
type RegisterScreenNavigationProp = StackNavigationProp<RootStackParamList, 'RegisterScreen'>;

type Props = {
  navigation: RegisterScreenNavigationProp;
};

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');

  // Validate inputs
  const validateEmail = () => {
    if (!email) {
      setEmailError('Please input your email.');
      return false;
    } else if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address.');
      return false;
    }
    return true;
  };

  // Handle pressing Enter
  const handleEnterPress = () => {
    if (validateEmail()) {
      setLoading(true);
      Keyboard.dismiss();
      sendEmailForMagicLink();
      setTimeout(() => {
        setLoading(false);
        navigation.navigate('CheckEmailScreen', { email });
      }, 2000); // Simulate loading
    }
  };

  // Send email to backend for magic link
  const sendEmailForMagicLink = async () => {
    try {
      const response = await axios.post('https://your-backend-api.com/api/magic-link', { email });
      if (response.status === 200) {
        // Email sent successfully
        //navigation.navigate('MainScreen');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      Alert.alert('Error', 'Unable to send magic link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require('../assets/images/e-background.png')}
      style={styles.background}
    >
      <View style={styles.container}>
        <View style={styles.wrapper}>
          <View style={styles.wave}>
            <ImageBackground
              source={require('../assets/images/outer-circle.png')}
              style={styles.circleContainer}
            >
              <Text style={styles.circleText}>E</Text>
            </ImageBackground>
          </View>
        </View>
        <View style={styles.loadingFrame}>
            <LoadingFrame animatedSegments= {0} />
        </View>

        {/* Email Input */}
        <TextInput
          style={styles.input}
          placeholder="Your email..."
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          onSubmitEditing={handleEnterPress}  // Trigger action on Enter
          returnKeyType="done"
        />
        {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

        {/* Loading Indicator */}
        {loading && <ActivityIndicator size="small" color="#ffffff" />}
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 100,
    width: 306,
    height: 306,
  },
  wave: {
    width: 306,
    height: 306,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingFrame: {
    position: 'absolute',
    width: 270,
    height: 270,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    zIndex: 0,
  },
  circleContainer: {
    position: 'absolute',
    width: 306,
    opacity: 0.5,
    height: 306,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  circleText: {
    fontSize: 70,
    color: 'white',
    fontFamily: 'Anton',
    fontWeight: 'bold',
    textAlign: 'center',
    fontStyle: 'italic',
    zIndex: 2,
  },
  input: {
    color: '#ffffff',
    borderColor: 'rgba(255, 255, 255, 0.20)',
    borderBottomWidth: 1,
    fontSize: 18,
    width: 320,
    textAlign: 'center',
    borderRadius: 8,
    marginBottom: 10,
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    marginBottom: 10,
    textAlign: 'center',
  },
});

export default RegisterScreen;
