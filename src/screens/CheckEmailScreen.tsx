import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, Alert, ActivityIndicator } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native'; // Import for route props
import { RootStackParamList } from '../types/navigation';
import LinearGradient from 'react-native-linear-gradient';
import axios from 'axios';
import LoadingFrame from '../components/LoadingFrame';
// Define the navigation prop and route prop types
type CheckEmailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'CheckEmailScreen'>;
type CheckEmailScreenRouteProp = RouteProp<RootStackParamList, 'CheckEmailScreen'>;

type Props = {
  navigation: CheckEmailScreenNavigationProp;
  route: CheckEmailScreenRouteProp;  // Add the route prop here
};

const CheckEmailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { email } = route.params; // Get the email from route params
  const [countdown, setCountdown] = useState(10); // Initial countdown time (e.g., 60 seconds)
  const [loading] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      if (countdown > 0) {
        setCountdown(countdown - 1);
      }
    }, 1000);

    return () => clearInterval(timer); // Cleanup the timer on unmount
  }, [countdown]);

  const handleResendButton = () => {
    setCountdown(10);
    sendEmailForMagicLink();
  };

  const sendEmailForMagicLink = async () => {
    try {
      const response = await axios.post('https://your-backend-api.com/api/magic-link', { email });
      if (response.status === 200) {
        // Email sent successfully
        navigation.navigate('MainScreen');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      Alert.alert('Error', 'Unable to send magic link. Please try again.');
    }
  };

  return (
    <ImageBackground
      source={require('../assets/images/e-background.png')} // Replace with your background image path
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

        <Text style={styles.messageTitle}>Check Your Email</Text>
        <Text style={styles.messageSubtitle}>
            We've sent a link to{'\n'}
            {email || 'your email address'}
        </Text>

        <View style={styles.resendButtonOuter}>
            <LinearGradient
            colors={['#202020', '#3a3e43']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
                styles.resendButtonOuter,
                countdown > 0 && styles.disabledButton,
            ]}
            >
            <TouchableOpacity style={styles.resendButton} disabled={countdown > 0} onPress={handleResendButton}>
            <Text style={styles.resendText}>
                {countdown > 0 ? `Resend (${countdown}sec)` : 'Resend'}
            </Text>
            {/* Loading Indicator */}
            {loading && <ActivityIndicator size="small" color="#ffffff" />}
            </TouchableOpacity>
            </LinearGradient>
        </View>
        <TouchableOpacity onPress={() => { /* Add help navigation if needed */ }}>
          <Text style={styles.helpText}>Help</Text>
        </TouchableOpacity>
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
    marginBottom: 40,
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
    height: 306,
    opacity: 0.5,
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
  messageTitle: {
    fontSize: 24,
    color: '#ffffff',
    marginBottom: 30,
    textAlign: 'center',
  },
  messageSubtitle: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 30,
    textAlign: 'center',
    lineHeight: 40,
  },
  resendButtonOuter: {
    width: 280,
    height: 107,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 140,
    marginLeft: -40,
  },
  resendButton: {
    width: 240,
    height: 67,
    backgroundColor: 'rgb(255, 255, 255)',
    marginTop: 20,
    borderRadius: 100,
    paddingVertical: 16,
    paddingHorizontal: 40,
    marginBottom: 20,
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  resendText: {
    color: '#363636',
    fontSize: 18,
    textAlign: 'center',
  },
  helpText: {
    color: '#FFF',
    fontSize: 18,
    marginLeft: 320,
  },
});

export default CheckEmailScreen;
