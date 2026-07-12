import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';

const RADAR_SIZE = 260;

// Each PulseRing is its own component so hooks are at component level, never in a loop
function PulseRing({ delay, size, color }: { delay: number; size: number; color: string }) {
  const scale = useSharedValue(0.2);
  const opacity = useSharedValue(0.7);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 2200, easing: Easing.out(Easing.quad) }),
          withTiming(0.2, { duration: 0 })
        ),
        -1,
        false
      )
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0, { duration: 2200, easing: Easing.out(Easing.quad) }),
          withTiming(0.7, { duration: 0 })
        ),
        -1,
        false
      )
    );
    return () => {
      cancelAnimation(scale);
      cancelAnimation(opacity);
    };
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 1.5,
          borderColor: color,
        },
        animStyle,
      ]}
    />
  );
}

function SweepLine({ color }: { color: string }) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 3000, easing: Easing.linear }),
      -1,
      false
    );
    return () => cancelAnimation(rotation);
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: RADAR_SIZE * 0.85,
          height: RADAR_SIZE * 0.85,
          borderRadius: (RADAR_SIZE * 0.85) / 2,
          overflow: 'hidden',
        },
        animStyle,
      ]}
    >
      {/* Sweep beam line */}
      <View
        style={{
          position: 'absolute',
          top: (RADAR_SIZE * 0.85) / 2 - 1,
          left: (RADAR_SIZE * 0.85) / 2,
          width: (RADAR_SIZE * 0.85) / 2,
          height: 2,
          backgroundColor: color,
          opacity: 0.85,
        }}
      />
      {/* Sweep glow wedge */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: (RADAR_SIZE * 0.85) / 2,
          width: (RADAR_SIZE * 0.85) / 2,
          height: (RADAR_SIZE * 0.85) / 2,
          backgroundColor: color,
          opacity: 0.04,
        }}
      />
    </Animated.View>
  );
}

function CenterPulse({ color }: { color: string }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.4, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
    return () => cancelAnimation(scale);
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        { width: 14, height: 14, borderRadius: 7, backgroundColor: color },
        animStyle,
      ]}
    />
  );
}

function DoneCheck({ color }: { color: string }) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.back(2)) });
    opacity.value = withTiming(1, { duration: 400 });
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: 60,
          height: 60,
          borderRadius: 30,
          backgroundColor: color + '22',
          borderWidth: 2,
          borderColor: color,
          alignItems: 'center',
          justifyContent: 'center',
        },
        animStyle,
      ]}
    >
      <View style={{ width: 24, height: 24 }}>
        <View style={[styles.checkLeft, { backgroundColor: color }]} />
        <View style={[styles.checkRight, { backgroundColor: color }]} />
      </View>
    </Animated.View>
  );
}

interface Props {
  isScanning: boolean;
  color: string;
  isDone?: boolean;
}

export function RadarScanner({ isScanning, color, isDone }: Props) {
  return (
    <View style={styles.container}>
      {/* Cross-hairs */}
      <View style={[styles.crossH, { backgroundColor: color + '20' }]} />
      <View style={[styles.crossV, { backgroundColor: color + '20' }]} />

      {/* Outer ring (static) */}
      <View
        style={[
          styles.outerRing,
          { borderColor: color + '18', width: RADAR_SIZE, height: RADAR_SIZE, borderRadius: RADAR_SIZE / 2 },
        ]}
      />

      {/* Static mid ring */}
      <View
        style={[
          styles.outerRing,
          {
            borderColor: color + '14',
            width: RADAR_SIZE * 0.65,
            height: RADAR_SIZE * 0.65,
            borderRadius: (RADAR_SIZE * 0.65) / 2,
          },
        ]}
      />

      {/* Pulse rings - each is its own component */}
      {isScanning && (
        <>
          <PulseRing delay={0} size={RADAR_SIZE * 0.95} color={color} />
          <PulseRing delay={733} size={RADAR_SIZE * 0.65} color={color} />
          <PulseRing delay={1466} size={RADAR_SIZE * 0.38} color={color} />
        </>
      )}

      {/* Sweep line */}
      {isScanning && <SweepLine color={color} />}

      {/* Center */}
      {isDone ? (
        <DoneCheck color={color} />
      ) : (
        <CenterPulse color={color} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: RADAR_SIZE,
    height: RADAR_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRing: {
    position: 'absolute',
    borderWidth: 1,
  },
  crossH: {
    position: 'absolute',
    width: RADAR_SIZE,
    height: 1,
  },
  crossV: {
    position: 'absolute',
    width: 1,
    height: RADAR_SIZE,
  },
  checkLeft: {
    position: 'absolute',
    bottom: 4,
    left: 2,
    width: 9,
    height: 2.5,
    borderRadius: 2,
    transform: [{ rotate: '45deg' }],
  },
  checkRight: {
    position: 'absolute',
    bottom: 6,
    left: 7,
    width: 16,
    height: 2.5,
    borderRadius: 2,
    transform: [{ rotate: '-55deg' }],
  },
});
