// LoadingFrame.tsx
import React from 'react';
import { Svg, Line, G } from 'react-native-svg';

const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
};

interface LoadingFrameProps {
  animatedSegments: number; // Receive animatedSegments from the parent
}

const LoadingFrame: React.FC<LoadingFrameProps> = ({ animatedSegments }) => {
  const segments = 50;  // Number of segments
  const radius = 100;   // Radius of the circle
  const lineLength = 20; // Length of each line segment
  const centerX = 120;   // Center of the circle
  const centerY = 120;   // Center of the circle

  const lines = Array.from({ length: segments }, (_, i) => {
    const angle = (i * 360) / segments;
    const start = polarToCartesian(centerX, centerY, radius, angle);  // Starting point
    const end = polarToCartesian(centerX, centerY, radius + lineLength, angle);  // End point

    // Color the segment green if it's within the animated range, otherwise set to default
    const color = i < animatedSegments ? "#178424" : "rgba(255, 255, 255, 0.05)";

    return (
      <Line
        key={`line-${i}`}
        x1={start.x}
        y1={start.y}
        x2={end.x}
        y2={end.y}
        stroke={color}
        strokeWidth="2"
        opacity="0.8"
      />
    );
  });

  return (
    <Svg width="240" height="240" viewBox="0 0 240 240" fill="none">
      <G>
        {lines}
      </G>
    </Svg>
  );
};

export default LoadingFrame;
