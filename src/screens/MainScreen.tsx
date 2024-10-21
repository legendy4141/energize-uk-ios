/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react/self-closing-comp */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-trailing-spaces */
/* eslint-disable quotes */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useRef } from 'react'; 
import { Image, View, Text, StyleSheet, ImageBackground, TouchableOpacity, ScrollView, TextInput, Alert, Platform, Animated} from 'react-native';
import { PanGestureHandler, State, GestureHandlerRootView, PanGestureHandlerGestureEvent} from 'react-native-gesture-handler';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import Icon from 'react-native-vector-icons/FontAwesome5';
import LinearGradient from 'react-native-linear-gradient';
// import WaveFrame from '../components/WaveFrame';
import LoadingFrame from '../components/LoadingFrame';
// import GradientText from '../components/GradientText';
import axios from 'axios';
// import AudioRecorderPlayer from 'react-native-audio-recorder-player';
// import SoundPlayer from 'react-native-sound-player'

const MainScreen: React.FC = () => {
    const [userTranscript, setUserTranscript] = useState<string | null>(null);
    const [message, setMessage] = useState('');
    const [typedResponse, setTypedResponse] = useState<string>('Hello, what should I call you?');
    const [audioFilePath, setAudioFilePath] = useState<string | null>(null);
    // const [audioRecorderPlayer] = useState(new AudioRecorderPlayer());
    const [isMuted, setMuted] = useState(false);
    const [animatedSegments, setAnimatedSegments] = useState(0);
    const [animationInterval, setAnimationInterval] = useState<NodeJS.Timeout | null>(null);
    const [statusInfo, setStatusInfo] = useState({ text: 'Initial', icon: 'pencil-alt' });
    const typingIntervalRef = useRef<NodeJS.Timeout | number | undefined>(undefined);
    const [audioURL, setAudioURL] = useState<string | null>(null);
    const [weather, setWeather] = useState('Sunny'); 
    const [translateY] = useState(new Animated.Value(0));  // For moving the component
    const [translateX] = useState(new Animated.Value(-300));  // Initially hidden off-screen to the left
    const [opacity] = useState(new Animated.Value(1));  // For fading out the component
    
    const [isLoading, setIsLoading] = useState(false); // For Loading Animation
    const [isAnimating, setIsAnimating] = useState(false); // For Spectrum Animation
    const [isKeyboardActive, setIsKeyboardActive] = useState(false); // For Keyboard Input
    const [isVisible, setIsVisible] = useState(true);  // To conditionally hide the component
    const [isRecording, setIsRecording] = useState(false); // For Recording State
    const [isTyping, setIsTyping] = useState(false); //For Typing State
  
    const scrollViewRef = useRef<ScrollView>(null);
    
    // Scroll to end whenever typedResponse updates (auto scroll for long responses)
    useEffect(() => {
      if (typedResponse) {
        scrollToEndDebounced();
      }
    }, [typedResponse]);
  
    const debounce = (fn: (...args: any[]) => void, delay: number) => {
      let timer: NodeJS.Timeout | undefined;
      return (...args: any[]) => {
        if (timer) {clearTimeout(timer);}
        timer = setTimeout(() => {
          fn(...args);
        }, delay);
      };
    };
  
    const scrollToEndDebounced = debounce(() => {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollToEnd({ animated: true });
      }
    }, 100);
  
    // Function to manage the LoadingFrame
    const animateLoadingFrame = () => {
      // let segmentCount = 0;
      // const totalSegments = 60;  // Total segments in the loading animation (modify based on actual number of segments)
      
      // const interval = setInterval(() => {
      //   segmentCount += 1;
      //   setAnimatedSegments(segmentCount);  // Update the animated segments
  
      //   // If all segments are filled, restart from the first segment
      //   if (segmentCount >= totalSegments) {
      //     segmentCount = 0;
      //   }
      // }, 100);  // Adjust the interval time for animation speed
  
      // setAnimationInterval(interval);  // Store the interval so we can clear it later
    };
  
    const stopLoadingAnimation = () => {
      if (animationInterval) {
        clearInterval(animationInterval);  // Clear the animation interval
        setAnimationInterval(null);
      }
      setAnimatedSegments(0);  // Reset to no animated segments
    };
  
    // When starting to load
    const handleStartLoading = () => {
      setIsLoading(true);
      animateLoadingFrame();  // Start the animation
    };
  
    // When stopping loading
    const handleStopLoading = () => {
      setIsLoading(false);
      stopLoadingAnimation();  // Stop the animation
    };
  
    // Function to handle when the microphone button is pressed (start recording and update call status)
    // const handleMicrophonePressIn = async () => {
    //   try {
    //     setIsKeyboardActive(false);
    //     if(statusInfo.text == "Responding")
    //       stopResponse();
        
    //     setStatusInfo({ text: 'Listening', icon: 'headphones' });
    //     console.log(statusInfo);
    //     const result = await audioRecorderPlayer.startRecorder();
    //     setAudioFilePath(result);  // Store the path of the recorded audio
    //     handleStartLoading();  // Set the recording state to true
    //     console.log('Recording started:', res  //   } catch (error) {
    //     console.error('Error starting recording:', error);
    //   }
    // };
  
    // Function to handle when the microphone button is released (stop recording and update call status)
    // const handleMicrophonePressOut = async () => {
    //   try {
    //       console.log("Here comes in.");
    //       // Stop recording and immediately update the UI to show the user that processing has started
    //       setIsRecording(false);  // Set the recording state to false
    //       setStatusInfo({ text: 'Thinking', icon: 'spinner' });
  
    //       const result = await audioRecorderPlayer.stopRecorder();  // Stop the recorder asynchronously
    //       console.log('Recording stopped:', result);
          
    //       // Call the backend in the background, so the UI is responsive
    //       await sendAudioToBackend(result);
    //   } catch (error) {
    //       console.error('Error stopping recording:', error);
    //   }
    // };
    
    // Function to Accept Calendar App Integration Permission
    const handleAcceptPermission = async () => { 
      try {
        let permissionStatus;
  
        if (Platform.OS === 'ios') {
          permissionStatus = await check(PERMISSIONS.IOS.CALENDARS);
        } else if (Platform.OS === 'android') {
          permissionStatus = await check(PERMISSIONS.ANDROID.READ_CALENDAR);
        }
        if (permissionStatus === RESULTS.GRANTED)
        {
        }
        else if (permissionStatus === RESULTS.DENIED) {
          // Request permission if it's denied
          let result;
          if (Platform.OS === 'ios') {
            result = await request(PERMISSIONS.IOS.CALENDARS);
          } else if (Platform.OS === 'android') {
            result = await request(PERMISSIONS.ANDROID.READ_CALENDAR);
          }
      
          if (result === RESULTS.GRANTED) {
            console.log("Permission granted");
            setStatusInfo({ text: 'Learning', icon: 'pencil-alt' });
          } else {
            console.log("Permission denied");
          }
        }
        else {
            console.log("Permission is blocked or unavailable");
            Alert.alert("Permission", "Calendar permission is blocked.");
        }
        setStatusInfo({ text: 'FinalSuggestion', icon: 'pencil-alt' });
      } catch (error) {
        console.error("Error requesting calendar permission:", error);
      }
    }; 
    
    // Function to Decline Calendar App Integration Permission
    const handleDeclinePermission = async () => {
      setStatusInfo({ text: 'Learning', icon: 'pencil-alt' });
    };
  
    // Modify sendAudioToBackend function to start/stop the animation
    // const sendAudioToBackend = async (audioPath: string) => {
    //   setIsLoading(true);
    //   const formData = new FormData();
    //   formData.append('audio', {
    //     uri: audioPath,
    //     type: 'audio/wav',
    //     name: 'audio.wav',
    //   });
    
    //   try {
    //     const response = await axios.post('https://c0c8-107-155-105-218.ngrok-free.app/api/audio', formData, {
    //       headers: {
    //         'Content-Type': 'multipart/form-data',
    //       },
    //     });
    //     setStatusInfo({ text: 'Responding', icon: 'pencil-alt' });
    //     const audioId = response.data.speechFileName;
    //     playAudio(audioId);
        
    //     const fullResponse = response.data.response;
    //     startTypingEffect(fullResponse);
    //     handleStopLoading();
    //   } catch (error) {
    //     console.error('Error sending audio to backend:', error);
    //     handleStopLoading();
    //   } finally {
    //     setIsLoading(false);
    //   }
    // };
    
    // Function to play the received audio using react-native-sound
    // const playAudio = (audioId: string) => {
    //   const audioURL = `http://https://c0c8-107-155-105-218.ngrok-free.app/uploads/${audioId}.mp3`;
    //   console.log(audioURL);
    
    //   // Play the audio and trigger wave animation
    //   if(isMuted)
    //     SoundPlayer.setVolume(0);
    //   SoundPlayer.playUrl(audioURL);
    //   setAudioURL(audioURL);
    //   setIsAnimating(true); 
  
    //   // Add listener for when the audio stops
    //   const finishedPlayingSubscription = SoundPlayer.addEventListener('FinishedPlaying', () => {
    //     setStatusInfo({ text: 'Learning', icon: 'pencil-alt' });
    //     setIsAnimating(false);
    //     finishedPlayingSubscription.remove();
    //   });
      
    //   return () => {
    //     finishedPlayingSubscription.remove();
    //   };
    // };
    
    // Function to stop the assistant's response
    const stopResponse = () => {
      // SoundPlayer.stop();
      console.log("Stop Button Clicked....");
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = undefined;
      }
      setTypedResponse('');
      setStatusInfo({ text: 'Learning', icon: 'pencil-alt' });
      setIsAnimating(false);
    };  
  
    // Function to simulate typing animation
    const startTypingEffect = (fullText: string) => {
      let index = 0;
      const chunkSize = 5;
      setTypedResponse('');
  
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
  
      typingIntervalRef.current = setInterval(() => {
        const nextChunk = fullText.slice(index, index + chunkSize);
  
        // Only update state every second chunk to lessen render frequency
        if (index % (chunkSize * 2) === 0) {
          setTypedResponse((prev) => prev + fullText.slice(index, index + chunkSize * 2));
          index += chunkSize * 2;
        } else {
          index += chunkSize;
        }
  
        if (index >= fullText.length) {
          if (typingIntervalRef.current !== undefined) {
            clearInterval(typingIntervalRef.current);
            typingIntervalRef.current = undefined;
          }
        }
      }, 350);
    };
    
    // Function to handle PanGesture to hide E when user swipes up 
    const onGestureEvent = (event: PanGestureHandlerGestureEvent) => {
      translateY.setValue(event.nativeEvent.translationY);  // Manually update translateY
    };
    
    const onHandlerStateChange = (event: PanGestureHandlerGestureEvent) => {
      if (event.nativeEvent.state === State.END) {
        const translationY = event.nativeEvent.translationY;
    
        if (translationY < -50) {
          // Swipe up: hide the component completely
          Animated.parallel([
            Animated.timing(translateY, {
              toValue: -300,  // Move the component off-screen
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,  // Fade out
              duration: 300,
              useNativeDriver: true,
            }),
          ]).start(() => {
            setIsVisible(false);  // Mark component as hidden after animation
          });
        } else {
          // Swipe down: show the component fully
          Animated.parallel([
            Animated.timing(translateY, {
              toValue: 0,  // Move the component to its original position
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 1,  // Fully visible
              duration: 300,
              useNativeDriver: true,
            }),
          ]).start(() => {
            setIsVisible(true);  // Mark component as visible after animation
          });
        }
      }
    };
  
    // Track the horizontal swipe with `translateX` for the menu
    const onSwipeGestureEvent = (event: PanGestureHandlerGestureEvent) => {
      translateX.setValue(event.nativeEvent.translationX);  // Update the X translation
    };
  
    const onSwipeStateChange = (event: PanGestureHandlerGestureEvent) => {
      console.log("Action X detected.");
      if (event.nativeEvent.state === State.END) {
        const translationX = event.nativeEvent.translationX;
  
        if (translationX < -100) {
          // Swipe left to show the menu
          Animated.timing(translateX, {
            toValue: 0,  // Slide in
            duration: 300,
            useNativeDriver: true,
          }).start();
        } else if (translationX > 100) {
          // Swipe right to hide the menu
          Animated.timing(translateX, {
            toValue: -300,  // Move out of view
            duration: 300,
            useNativeDriver: true,
          }).start();
        }
      }
    };
  
    //Function to handle Keyboard Press
    const handleKeyboardPress = () => {
      if (statusInfo.text === "Responding")
        {stopResponse();}
      setStatusInfo({ text: 'Learning', icon: 'pencil-alt' });
      setIsTyping(true);
      setIsKeyboardActive(true);
    };
  
    const handleSend = async () => {
      if (message.trim()) {
        setIsTyping(false);
        setStatusInfo({ text: 'Thinking', icon: 'spinner' });
        setIsLoading(true);  // Start loading
        try {
          // Make a POST request to the backend
          const response = await axios.post('https://c0c8-107-155-105-218.ngrok-free.app/api/text', { 
            text: message,  // Sending the message from the input field
          });
          if (message.includes("golf")) {
            setStatusInfo({ text: 'Suggestion', icon: 'pencil-alt' });
          } else if (message.includes("calendar")) {
            setStatusInfo({ text: 'AskingPermissions', icon: 'pencil-alt' });
          } else {
            setStatusInfo({ text: 'Learning', icon: 'pencil-alt' });
          }    
          // Update state with the backend's response
          startTypingEffect(response.data.response);
        } catch (error) {
          console.error('Error sending message:', error);
        } finally {
          setIsLoading(false);  // Stop loading
          setMessage('');  // Clear the input field after sending
        }
      }
    };
  
    const handleSuggestionAccept = async() => {
    };
    
    return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ImageBackground
        source={require('../assets/images/e-background.png')}
        style={styles.background}
      >
        <View style={styles.container}>
           {/* Circle with 'E' */}
           <PanGestureHandler
            onGestureEvent={onGestureEvent}
            onHandlerStateChange={onHandlerStateChange}
          >
            <View >
              {isVisible && (
                <Animated.View style={{ transform: [{ translateY: translateY }], opacity: opacity, alignItems:'center' }}>
                  <View style={styles.wrapper}>
                    <View style={styles.wave}>
                      {/* <WaveFrame isAnimating={false} audioURL={audioURL} status={statusInfo.text}/> */}
                      <ImageBackground
                        source={require('../assets/images/outer-circle.png')}
                        style={styles.circleContainer}
                      >
                        {(statusInfo.text === 'Learning' || statusInfo.text === 'Listening' || statusInfo.text === 'Initial')? (
                          <Text style={styles.circleText}>E</Text>
                        ) : (
                          <Image
                            source={{
                              uri:
                                statusInfo.text === 'Listening'
                                  ? 'https://img.icons8.com/?size=100&id=ffcAdhLIF2Tv&format=png&color=000000'
                                  : (statusInfo.text === 'Thinking' 
                                  ? 'https://img.icons8.com/?size=100&id=V1VLi2tvtOhM&format=png&color=000000' 
                                  : (statusInfo.text === 'Responding'
                                  ? 'https://img.icons8.com/?size=100&id=AHVprpq_28gI&format=png&color=000000'
                                  : ((statusInfo.text === 'Suggestion' || statusInfo.text ==='FinalSuggestion')
                                  ? 'https://img.icons8.com/?size=100&id=eZBdUuW3frUK&format=png&color=000000'
                                  : 'https://img.icons8.com/?size=100&id=A2ME5jtXkheX&format=png&color=000000'))),
                            }}
                            style={styles.statusIconImage}
                          />
                        )}
                      </ImageBackground>
                    </View>
                    <View style={styles.loadingFrame}>
                      <LoadingFrame animatedSegments={animatedSegments} />
                    </View>
                  </View>
                  
                  {/* Status Text */}
                  {(statusInfo.text !== 'Suggestion' && statusInfo.text !== 'FinalSuggestion') && (
                    <View style={styles.statusContainer}>
                      {statusInfo.text !== 'AskingPermissions' && (
                        <Icon name={statusInfo.icon} size={16} color="#AAAAAA" style={styles.statusIcon} /> 
                      )}
                      <Text style={styles.statusText}>
                        {(statusInfo.text === "Learning" || statusInfo.text === "Initial")
                          ? "Learning" 
                          : (statusInfo.text === 'AskingPermissions' ? 'Need Permissions' : "Thinking")}
                      </Text>
                    </View>
                    
                  )}
                </Animated.View>
              )}
            </View>
          </PanGestureHandler>
        </View>
      </ImageBackground>
    </GestureHandlerRootView>
    );
};
const styles = StyleSheet.create({
    // Main Background and Container
    background: {
      flex: 1,
      resizeMode: 'cover',
    },
    container: {
      flex: 1,
      alignItems: 'center',
    },
  
    // Menu Bar
    menuBar: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 300,
      backgroundColor: '#25282A',
      padding: 20,
      justifyContent: 'center',
    },
    menuText: {
      fontSize: 20,
      color: '#FFF',
      marginVertical: 10,
    },
  
    // E-Circle
    wrapper: {
      alignItems: 'center',
      justifyContent: 'center',
      width: 306,
      height: 306,
    },
    wave: {
      width: 306,
      height: 306,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    circleContainer: {
      position: 'absolute',
      width: 306,
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
    statusIconImage: {
      width: 70,
      height: 70,
      resizeMode: 'contain',
    },
    loadingFrame: {
      position: 'absolute',
      width: 270,
      height: 270,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 0,
    },
  
    // StatusText
    statusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statusIcon: {
      marginRight: 8,
    },
    statusText: {
      fontSize: 16,
      color: '#AAAAAA',
    },
  
    // Suggestion Box
    suggestionContainer: {
      width: 368,
      backgroundColor: '#25282A',
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 8,
      gap: 12,
      padding: 12,
    },
    suggestionArea: {
      width: 60,
      height: 60,
      borderRadius: 6,
    },
    suggestionTextBox: {
      justifyContent: 'center',
    },
    suggestionTitle: {
      color: 'white',
      fontSize: 16,
      lineHeight:  21,
      paddingBottom: 2,
    },
    suggestionInfo: {
      display: 'flex',
      flexDirection: 'row',
      gap: 4,
    },
    suggestionAccept: {
      width: 48,
      height: 48,
      borderRadius: 1000,
      alignItems: 'center',
      padding: 12,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.02)',
      backgroundColor: '#25282A'
    },
    suggestionAppBox: {
      display: 'flex',
      flexDirection: 'row',
      padding: 12,
      gap: 12,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 8,
      backgroundColor: '#25282A',
      marginTop: 8,
    },
    
    // Suggested Month and Date
    calendarIcon: {
      width: 60,
      height: 60,
      display:'flex',
      flexDirection:'column',
      backgroundColor: '#FFF',
      borderRadius: 6,
    },
    suggestedMonthBox: {
      justifyContent: 'center',
      alignItems: 'center',
      gap: 4,
      alignSelf: 'stretch',
      borderTopLeftRadius: 6,
      borderTopRightRadius: 6,
      backgroundColor: '#F2564E',
    },
    suggestedMonthText: {
      color: '#FFF',
      fontSize: 12
    },
    suggestedDayBox: {
      justifyContent: 'center',
      alignItems: 'center',
      gap: 4,
      backgroundColor: '#FFF',
      alignSelf: 'stretch',
      borderBottomLeftRadius: 6,
      borderBottomRightRadius: 6,
    },
    suggestedDayText: {
      fontSize: 32,
      color: '#363636',
    },
  
    // Suggested Time
    timeIcon: {
      width: 60,
      height: 60,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 4,
      borderRadius: 6,
      backgroundColor: '#494D50',
    },
    suggestedTimeText: {
      color: '#FFF',
      fontSize: 12,
      lineHeight: 15.96,
    },
  
    // Suggested Weather
    weatherIcon: {
      display: 'flex',
      width: 60,
      height: 60,
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 6
    },
    weatherIconInner: {
      display: 'flex',
      width: 60,
      height: 60,
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
      borderRadius: 6,
      alignSelf: 'stretch',
    },
    weatherCondition: {
      width: 24,
      height: 24,
    },
    weatherTemperature: {
      color: '#FFF',
      fontSize: 18,
    },
  
    // Info about the Location
    ratingText: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.75)',
      paddingRight: 4,
    },
    distanceText: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.75)',
    },
    
    // Assistant's Response
    responseContainer: {
      marginTop: 40,
      marginHorizontal: 35,
    },
    responseBubbleBox: {
      marginLeft: 16,
      marginRight: 38,
      marginTop: 40,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: 'rgba(153, 153, 153, 0.50)',
      paddingVertical: 12,
      paddingHorizontal: 16,
      maxHeight: 96,
      backgroundColor: 'rgba(0, 0, 0, 0.40)',
      color: 'rgba(255, 255, 255, 0.50)',
      overflow: 'hidden',
    },
    assistantResponse: {
      fontSize: 20,
      color: 'rgba(255, 255, 255, 0.50)',
    },
    
    // Transcript Box
    transcriptBox: {
      marginTop: 37,
      height: 110,
      width: 300,
      backgroundColor: 'black',
      borderRadius: 10,
      padding: 10,
      alignItems: 'center',
    },
    wireFrame: {
      width: 25.5,
      height: 17,
    },
    transcriptText: {
      marginTop: 12,
      textAlign: 'center',
      fontSize: 20,
      color: '#FFFFFF',
    },
  
    // IntroText Box
    introTextContainer:
    {
      alignItems: 'center',
      marginTop: 30,
    },
    introText:
    {
      fontSize: 16,
      color: 'white',
      textAlign: "center",
      lineHeight: 25,
    },
  
    bottomSection: {
      marginTop: 40,
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginHorizontal: 24,
      alignItems: 'center',
      width: "100%",
      bottom: 20,
      right: 0,
    },
    initialButtonOuter: {
      width: 212,
      height: 120,
      borderRadius: 60,
      display: 'flex',
      flexDirection: 'row',
      gap: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    initialButtonInner: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: '#FFF',
      justifyContent: 'center',
      alignItems: 'center',
    },
    declineButton:
    {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: '#25282A',
      justifyContent: 'center',
      alignItems: 'center',
    },
    micButtonOuter: {
      width: 120,
      height: 120,
      borderRadius: 60,
      justifyContent: 'center',
      alignItems: 'center',
    },
    micButtonMicrophone: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: '#FFF',
      justifyContent: 'center',
      alignItems: 'center',
    },
    micButtonStop: {
      width: 80,
      height: 80,
      borderRadius: 40,
      borderWidth: 1,
      borderColor: '#383C3F',
      backgroundColor: '#25282A',
      justifyContent: 'center',
      alignItems: 'center',
    },
    smallButton: {
      width: 60,
      height: 60,
      borderRadius: 30,
      borderWidth: 1,
      borderColor: 'rgba(153, 153, 153, 0.1)',
      backgroundColor: '#25282A',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 12,
    },
    disabledButton: {
      opacity: 0.5,
    },
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
      justifyContent: 'center',
      alignItems: 'center',
    },
  
    // MessageBox for Text-to-Tet
    messageBox: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
      bottom: 30,
      width: '100%',
    },
    inputContainer: {
      backgroundColor: '#33363A',
      borderRadius: 100,
      height: 60,
      width: 505,
      borderWidth: 1, 
      flex: 1,
      paddingVertical: 1,
      paddingLeft: 15,
      marginRight: 13,
    },  
    inputField: {
      flex: 1, 
      color: '#FFFFFF',
      fontSize: 18,
    },
    sendButton: {
      right: 0,
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 5,
    },
});
export default MainScreen;