import React from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';

// Define the navigation prop type
type WelcomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'WelcomeScreen'>;

type Props = {
  navigation: WelcomeScreenNavigationProp;
};

const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
    return (
        <ImageBackground
            source={require('../assets/images/welcome-screen.png')}  // Background image
            style={styles.background}
        >
            {/* Title Text */}
            <Text style={styles.titleText}>AI Powered Fitness</Text>

            {/* Subtitle Text */}
            <Text style={styles.subtitleText}>Let's get Energized.</Text>

            {/* Start Button */}
            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={styles.startButton}
                    onPress={() => navigation.navigate('RegisterScreen')}
                >
                    <ImageBackground
                    source={require('../assets/images/next-button.png')} // Use your image here
                    style={styles.imageButton}  // Add appropriate styling
                     />
                </TouchableOpacity>
            </View>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    background: {
        display: 'flex',
        flex: 1,
        resizeMode: 'cover',
    },
    titleText: {
        fontSize: 56,
        marginTop: 94,
        marginLeft: 16,
        fontWeight: 'bold',
        color: 'white',
    },
    subtitleText: {
        marginTop: 12,
        marginLeft: 16,
        fontSize: 24,
        color: 'white',
    },
    buttonContainer: {
        marginTop: '110%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    },
    startButton: {
        width: 78,
        height: 78,
    },
    imageButton: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageStyle: {
        borderRadius: 50,  // Optional: if you want a round button
    },
    buttonText: {
        fontSize: 30,
        color: '#FFFFFF',
    },
});

export default WelcomeScreen;
