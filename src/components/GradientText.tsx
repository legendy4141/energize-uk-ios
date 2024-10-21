import React from 'react';
import { Text, TextProps } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import LinearGradient from 'react-native-linear-gradient';

const GradientText = (props: React.JSX.IntrinsicAttributes & React.JSX.IntrinsicClassAttributes<Text> & Readonly<TextProps>) => {
  return (
    <MaskedView maskElement={<Text {...props} />}>
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.50)', '#FFF', 'rgba(153, 153, 153, 0.50)']}
        start={{ x: 0.04, y: 0 }}
        end={{ x: 1, y: 0.5 }}
      >
        <Text {...props} style={[props.style, { opacity: 0 }]} />
      </LinearGradient>
    </MaskedView>
  );
};

export default GradientText;