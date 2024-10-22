/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react/self-closing-comp */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-trailing-spaces */
/* eslint-disable quotes */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useRef } from 'react'; 
import { Image, View, Text, StyleSheet, ImageBackground, TouchableOpacity, ScrollView, TextInput, Alert, Platform, Animated, KeyboardAvoidingView} from 'react-native';
import { PanGestureHandler, State, GestureHandlerRootView, PanGestureHandlerGestureEvent} from 'react-native-gesture-handler';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import Icon from 'react-native-vector-icons/FontAwesome5';
import LinearGradient from 'react-native-linear-gradient';
// import WaveFrame from '../components/WaveFrame';
import LoadingFrame from '../components/LoadingFrame';
import GradientText from '../components/GradientText';
import axios from 'axios';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import RNFS from 'react-native-fs';
import Sound from 'react-native-sound';
import {
  Player,
  Recorder,
  MediaStates
} from '@react-native-community/audio-toolkit';

const dirs = RNFS;

const MainScreen: React.FC = () => {
    const [userTranscript, setUserTranscript] = useState<string | null>(null);
    const [message, setMessage] = useState('');
    const [typedResponse, setTypedResponse] = useState<string>('Hello, what should I call you?');
    const [audioFilePath, setAudioFilePath] = useState<string | null>(null);
    const [audioRecorderPlayer] = useState(new AudioRecorderPlayer());
    const [isMuted, setMuted] = useState(false);

    const [animatedSegments, setAnimatedSegments] = useState(0);
    const [animationInterval, setAnimationInterval] = useState<NodeJS.Timeout | null>(null);
    const animationIntervalRef = useRef<NodeJS.Timeout | null>(null);  // Use ref instead of state for intervals

    const [statusInfo, setStatusInfo] = useState({ text: 'Initial', icon: 'pencil-alt' });
    const typingIntervalRef = useRef<NodeJS.Timeout | number | undefined>(undefined);
    const [weather, setWeather] = useState('Sunny'); 
    const [translateY] = useState(new Animated.Value(0));  // For moving the component
    const [translateX] = useState(new Animated.Value(-300));  // Initially hidden off-screen to the left
    const [opacity] = useState(new Animated.Value(1));  // For fading out the component
    
    const [isLoading, setIsLoading] = useState(false); // For Loading Animation
    const [isAnimating, setIsAnimating] = useState(false); // For Spectrum Animation
    const [isKeyboardActive, setIsKeyboardActive] = useState(false); // For Keyboard Input
    const [isVisible, setIsVisible] = useState(true);  // To conditionally hide the component
    const [isTyping, setIsTyping] = useState(false); //For Typing State

    const [isRecording, setIsRecording] = useState(false);
    const [audioFileUri, setAudioFileUri] = useState('');
    const [soundInstance, setSoundInstance] = useState<Sound | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioPlayer] = useState(new AudioRecorderPlayer());
    const [receivedAudioUrl, setReceivedAudioUrl] = useState('');

    const scrollViewRef = useRef<ScrollView>(null);

    const recorder = new Recorder(`${RNFS.DocumentDirectoryPath}/test.m4a`);
    const [filePath, setFilePath] = useState(null);
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
  
    // Start the animation
    const animateLoadingFrame = () => {
      let segmentCount = 0;
      const totalSegments = 60;  // Total segments in the loading animation

      // Clear any existing animation interval to avoid multiple intervals
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
      }

      const interval = setInterval(() => {
        segmentCount += 1;
        setAnimatedSegments(segmentCount);  // Update the animated segments

        if (segmentCount >= totalSegments) {
          segmentCount = 0;  // Restart from the first segment
        }
      }, 100);  // Adjust the interval time for animation speed

      console.log("Starting animation, interval ID:", interval);
      animationIntervalRef.current = interval;  // Store the interval ID in the ref
    };

    // Stop the animation
    const stopLoadingAnimation = () => {
      console.log("Stopping Animation. Interval ID:", animationIntervalRef.current);

      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);  // Clear the animation interval
        animationIntervalRef.current = null;  // Reset the interval in the ref
        console.log("Animation Stopped");
      } else {
        console.log("No interval found to stop");
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
      console.log("isLoadingFalse");
      stopLoadingAnimation();  // Stop the animation
    };
    
    // Check and request microphone permission
    const checkMicrophonePermission = async () => {
      if (Platform.OS === 'ios') {
        const result = await check(PERMISSIONS.IOS.MICROPHONE);
        switch (result) {
          case RESULTS.UNAVAILABLE:
            console.log('This feature is not available (on this device / in this context)');
            break;
          case RESULTS.DENIED:
            console.log('The permission has not been requested / is denied but requestable');
            const requestResult = await request(PERMISSIONS.IOS.MICROPHONE);
            console.log('Request result: ', requestResult);
            break;
          case RESULTS.GRANTED:
            console.log('The permission is granted');
            break;
          case RESULTS.BLOCKED:
            console.log('The permission is denied and not requestable anymore');
            break;
        }
      }
    };
  
    // Function to handle when the microphone button is pressed (start recording and update call status)
    const handleMicrophonePressIn = async () => {
        try {
          setIsKeyboardActive(false);
          if(statusInfo.text === "Responding")
            stopResponse();
          checkMicrophonePermission();
          handleStartLoading();  // Set the recording state to true
          
          setStatusInfo({ text: 'Listening', icon: 'headphones' });
          const result = await audioRecorderPlayer.startRecorder();
          setAudioFilePath(result);  // Store the path of the recorded audio
          // const fileName = 'test.mp4';
          // let recorder = new Recorder(fileName, {
          //   bitrate: 256000,
          //   channels: 2,
          //   sampleRate: 44100,
          //   quality: 'high',
          // }).prepare((err, fspath) => {
          //   if (err) {
          //     console.log('recorder prepare failed: ', err);
          //   } else if (!err) {
          //     props.onFileURIChange(fspath);
          //     console.log('fspath: ', fspath);
          //     recorder.record();
          //   }
          // });
          setIsRecording(true);
          console.log("Recording Started");
        } catch (error) {
          console.error('Error starting recording:', error);
        }
    };
    // Function to handle when the microphone button is released (stop recording and update call status)
    const handleMicrophonePressOut = async () => {
      try {
          console.log("Here comes in.");
          // Stop recording and immediately update the UI to show the user that processing has started
          setIsRecording(false);  // Set the recording state to false
          setStatusInfo({ text: 'Thinking', icon: 'spinner' });

          recorder.stop();
          const savedFilePath = recorder.fsPath;  // Get the file path after stop
          console.log('Recording stopped. File saved at:', savedFilePath);
          await uploadAudioFile(savedFilePath);
      } catch (error) {
          console.error('Error stopping recording:', error);
      }
    };
    
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
  
    // Upload audio file
    const uploadAudioFile = async (audioFileUri: string) => {
      const formData = new FormData();
      formData.append('file', {
        uri: audioFileUri,
        name: 'audio.m4a',
        type: 'audio/m4a',
      });

      try {
        const response = await axios.post('https://4588-107-155-105-218.ngrok-free.app/api/audio', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        setStatusInfo({ text: 'Responding', icon: 'pencil-alt' });
        const audioId = response.data.speechFileName;
        playAudio(audioId);
        
        const fullResponse = response.data.response;
        startTypingEffect(fullResponse);
        handleStopLoading();
      } catch (error) {
        console.error('Error sending audio to backend:', error);
        handleStopLoading();
      } finally {
        setIsLoading(false);
      }
    };
    
    // Function to play the received audio using react-native-sound
    const playAudio = (audioId: string) => {
      const audioURL = `http://https://4588-107-155-105-218.ngrok-free.app/uploads/${audioId}.mp3`;
      console.log(audioURL);
      const sound = new Sound(audioURL, undefined, (error) => {
        if (error) {
          console.error('Failed to load sound', error);
          return;
        }
    
        // Set volume
        if(isMuted)
          sound.setVolume(0);
    
        // Play the sound
        sound.play((success) => {
          if (success) {
            console.log('Sound finished playing');
          } else {
            console.log('Playback failed due to audio decoding errors');
          }
          sound.release(); // Release when finished
          setIsPlaying(false);
          setSoundInstance(null); // Clear the sound instance
        });

        setIsPlaying(true);
        setSoundInstance(sound); // Store the sound instance globally
      });
      setIsAnimating(true); 
    };
    
    // Function to stop the assistant's response
    const stopResponse = () => {
      if (soundInstance) {
        soundInstance.stop(() => {
          console.log('Audio playback stopped manually');
        });
        setIsPlaying(false);
        setSoundInstance(null);
      }
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
        handleStartLoading();  // Start loading
        try {
          // Make a POST request to the backend
          const response = await axios.post('https://4588-107-155-105-218.ngrok-free.app/api/text', { 
            text: message,  // Sending the message from the input field
          });
          handleStopLoading();  // Stop loading
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

          {/* Suggestion Box */}
          {(statusInfo.text === 'Suggestion' || statusInfo.text === 'FinalSuggestion') && (
            <View style={styles.suggestionContainer}>
              <Image source={require('../assets/images/suggestion_area.jpg')} style = {styles.suggestionArea}/>
              <View style={styles.suggestionTextBox}>
                <Text style= {styles.suggestionTitle}>Southampton Golf Course</Text>
                <View style = {styles.suggestionInfo}> 
                  <Icon name="star" size={16} color="yellow"></Icon>
                  <Text style = {styles.ratingText}>4.5(104)</Text>
                  <Text style = {styles.distanceText}>2.4km Away</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.suggestionAccept} onPress={handleSuggestionAccept}>
                <Icon name="paper-plane" size={20} color="white"  />
              </TouchableOpacity>
            </View>
          )}

          {/* Suggestion App Box */}
          {statusInfo.text === 'FinalSuggestion' && (
            <View style={styles.suggestionAppBox}>
              <View style={styles.calendarIcon}>
                <View style={styles.suggestedMonthBox}>
                  <Text style={styles.suggestedMonthText}>Aug</Text>
                </View>
                <View style={styles.suggestedDayBox}>
                  <Text style={styles.suggestedDayText}>24</Text>
                </View>
              </View>
              <View style={styles.timeIcon}>
                <Text style={styles.suggestedTimeText}>11am</Text>
                <Text style={styles.suggestedTimeText}>|</Text>
                <Text style={styles.suggestedTimeText}>2pm</Text>
              </View>
              <View style={styles.weatherIcon}>
                <LinearGradient
                  colors={['#389AF5', '#006FD7']}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={styles.weatherIconInner}
                >
                  <Image source={{uri:
                    weather === 'Sunny' ? 'https://img.icons8.com/?size=100&id=648&format=png&color=FFCC00':
                    (weather === 'Cloudy' ? 'https://img.icons8.com/?size=100&id=zIVmoh4T8wh7&format=png&color=000000':
                    'https://img.icons8.com/?size=100&id=51451&format=png&color=000000'
                    )}}
                    style={styles.weatherCondition}/>
                  <Text style={styles.weatherTemperature}>19°</Text>
                </LinearGradient>
              </View>
            </View>
          )
          }

          {/* Assistant's Response */}
          {/* <PanGestureHandler
            onGestureEvent={onGestureEvent}
            onHandlerStateChange={onHandlerStateChange}
          > */}
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={{flexGrow: 1}}
            showsVerticalScrollIndicator={false}
          >
            <View style={(isTyping || (isKeyboardActive && statusInfo.text == 'Thinking')) ? styles.responseBubbleBox : styles.responseContainer}>
                <Text style={isTyping ? [styles.assistantResponse, {textAlign: 'left'}] : [styles.assistantResponse, {textAlign: 'center'}]}>
                  {statusInfo.text === "Initial" 
                    ? "Hey, what should I call you?"
                    : (statusInfo.text === "Suggestion"
                      ? "So, after our initial consultation, I have found a highly-rated golf course around the corner from you.\n\nI've checked, and they have bookings for today. Want me to book you in?"
                      : (statusInfo.text === "AskingPermissions"
                        ? "With your permission, we can make sure we work around your schedule?"
                        : (statusInfo.text === "FinalSuggestion"
                        ? "How about Sat 24th Aug, 11am-2pm? It looks like a perfect day for golf. Would you like me to book you in?"
                        : (statusInfo.text === "Thinking" && isKeyboardActive)
                        ? message
                        : typedResponse)))
                  }
                </Text>
              </View>
          </ScrollView>
          {/* </PanGestureHandler> */}

          {/* Intro Text */}
          {(statusInfo.text === 'Initial' || statusInfo.text === 'AskingPermissions') &&(
            <GradientText style={styles.introText}>
              {statusInfo.text === 'Initial' 
                ? "You can either talk or type to E" + "\n" + "Don’t worry, you can change at any time" 
                : "E can create, delete and reschedule your fitness events."
              }
            </GradientText>
          )}
          
          {/*Bottom Buttons Section*/}
          <View style={styles.bottomSection}>  
            {/* Initial Buttons */}
            {(statusInfo.text === 'Initial' || statusInfo.text === 'AskingPermissions') && (
              <LinearGradient
                colors={['#202020', '#3a3e43']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.initialButtonOuter}
              >
                {statusInfo.text === 'Initial' && (
                  <>
                    <TouchableOpacity style={styles.initialButtonInner} onPress={handleKeyboardPress}>
                      <Icon name={'keyboard'} size={28} color="#373b40" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.initialButtonInner} onPress={handleMicrophonePressIn}>
                      <Icon name={'microphone'} size={28} color="#373b40" />
                    </TouchableOpacity>
                  </>
                )}
          
                {statusInfo.text === 'AskingPermissions' && (
                  <> 
                    <TouchableOpacity style={styles.declineButton} onPress={handleDeclinePermission}>
                      <Icon name={'times'} size={28} color="white" />
                    </TouchableOpacity> 
                    <TouchableOpacity style={styles.initialButtonInner} onPress={handleAcceptPermission}>
                      <Icon name={'check'} size={28 } color="#373b40" />
                    </TouchableOpacity>
                  </>
                )}
              </LinearGradient>
            )}

            {/* Conditional Rendering for Mute and Small Microphone Icons */}
            {(statusInfo.text !== 'Initial' && statusInfo.text !== 'AskingPermissions' && !isTyping) && (
                <TouchableOpacity 
                  style={[
                    styles.smallButton,
                    (statusInfo.text === 'Listening' || statusInfo.text === 'Thinking' || isKeyboardActive) && styles.disabledButton
                  ]}
                  onPress={(statusInfo.text !== 'Listening' && !isKeyboardActive )? () => setMuted(!isMuted) : undefined}
                  disabled={statusInfo.text === 'Listening'}
                >
                  <Icon name={isMuted ? 'volume-off' : (isKeyboardActive? 'volume-mute': 'volume-up')} size={28} color="white" />
                </TouchableOpacity>
            )}

            {/* Microphone Button (Hidden when keyboard is active) */}
            {(!isTyping && statusInfo.text != "Initial" && statusInfo.text !== 'AskingPermissions') && (
              <View style={styles.micButtonOuter}>
                <LinearGradient
                  colors={['#202020', '#3a3e43']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.micButtonOuter]}
                >
                  <TouchableOpacity
                    style={statusInfo.text === 'Listening' ? styles.micButtonStop : styles.micButtonMicrophone}
                    onPress={
                      isKeyboardActive ? handleKeyboardPress : ((statusInfo.text === 'Learning' || statusInfo.text == 'Suggestion') ? handleMicrophonePressIn : handleMicrophonePressOut)
                    }
                  >
                    <Icon
                      name={
                        statusInfo.text === 'Listening' ? 'stop' : (isKeyboardActive ?'keyboard' : 'microphone')
                      } 
                      size={35}
                      color={statusInfo.text === 'Listening' ? "white" : "#373b40"}
                    />
                  </TouchableOpacity>
                </LinearGradient>
              </View>          
            )}

            {/* Keyboard Button */}
            {(statusInfo.text != "Initial" && statusInfo.text !== 'AskingPermissions' && !isTyping) && (<TouchableOpacity 
              style={[
                styles.smallButton,
                (statusInfo.text === 'Listening') && styles.disabledButton
              ]}
              onPress={statusInfo.text !== 'Listening' ? (isKeyboardActive ? handleMicrophonePressIn: handleKeyboardPress) : undefined}
              disabled={statusInfo.text === 'Listening'}
            >
              <Icon name={ !isKeyboardActive ? "keyboard" : "microphone"} size={28} color="white" />
            </TouchableOpacity>)}
          </View>

          {/* Show Input Field when Keyboard is Active */}
          {(isKeyboardActive && isTyping) && (
              <View style={styles.messageBox}>
              <LinearGradient
                colors={['#9999990D', '#FFFFFF1A']}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={styles.inputContainer}
              >
                <TextInput
                  style={styles.inputField}
                  placeholder="Type your message..."
                  placeholderTextColor="#999"
                  value={message}
                  onChangeText={(text) => setMessage(text)}
                />
              </LinearGradient>
              <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
                <Icon name="paper-plane" size={20} color="#33363A" />
              </TouchableOpacity>
            </View>
          )}
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