import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import Animated, {
  measure,
  useAnimatedRef,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  type AnimatedRef,
  type SharedValue,
  type MeasuredDimensions,
  runOnJS,
} from 'react-native-reanimated';
import { AutoScrollRootContext } from './DragDropScroll';

export interface HoveredItemContextType {
  setHoveredItem: (
    jsx: JSX.Element,
    position: { x: number; y: number },
    size: { width: number; height: number }
  ) => void;
  clearHoveredItem: () => void;
  moveHoveredItem: (position: { x: number; y: number }) => void;
  measureHoveredItem: () => MeasuredDimensions | null;
}

export const HoveredItemContext = React.createContext<HoveredItemContextType>({
  setHoveredItem: () => {},
  clearHoveredItem: () => {},
  moveHoveredItem: () => {},
  measureHoveredItem: () => null,
});

export interface HoveredItemContextProviderProps {
  children: React.ReactNode;
}

export function HoveredItemContextProvider(
  props: HoveredItemContextProviderProps
) {
  const { children } = props;

  const animatedRef = useAnimatedRef<Animated.View>();
  const hoveredItemMounted = useSharedValue(false);
  const [itemMetaReady, setItemMetaReady] = useState(false);
  const [hoveredItemJSX, setHoveredItemJSX] = useState<JSX.Element>();
  const hoveredItemMeta = useSharedValue<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>({ x: 0, y: 0, width: 0, height: 0 });

  useHoveredItemAutoScroll(animatedRef, hoveredItemMounted, hoveredItemMeta);

  const setHoveredItem = useCallback<HoveredItemContextType['setHoveredItem']>(
    (jsx, position, size) => {
      hoveredItemMeta.modify(() => {
        'worklet';
        runOnJS(setItemMetaReady)(true);
        return { ...position, ...size };
      }, true);
      setHoveredItemJSX(jsx);
    },
    [hoveredItemMeta, setHoveredItemJSX]
  );

  const clearHoveredItem = useCallback<
    HoveredItemContextType['clearHoveredItem']
  >(() => {
    setHoveredItemJSX(undefined);
    setItemMetaReady(false);
  }, [setHoveredItemJSX]);

  const moveHoveredItem = useCallback<
    HoveredItemContextType['moveHoveredItem']
  >(
    (position) => {
      'worklet';
      hoveredItemMeta.value = { ...hoveredItemMeta.value, ...position };
    },
    [hoveredItemMeta]
  );

  const measureHoveredItem = useCallback<
    HoveredItemContextType['measureHoveredItem']
  >(() => {
    'worklet';
    return measure(animatedRef);
  }, [animatedRef]);

  const value = useMemo<HoveredItemContextType>(
    () => ({
      setHoveredItem,
      clearHoveredItem,
      moveHoveredItem,
      measureHoveredItem,
    }),
    [clearHoveredItem, setHoveredItem, moveHoveredItem, measureHoveredItem]
  );

  return (
    <HoveredItemContext.Provider value={value}>
      {children}
      {hoveredItemJSX == null || !itemMetaReady || (
        <HoveredItem
          animatedRef={animatedRef}
          hoveredItemMounted={hoveredItemMounted}
          hoveredItemJSX={hoveredItemJSX}
          hoveredItemMeta={hoveredItemMeta}
        />
      )}
    </HoveredItemContext.Provider>
  );
}

export interface HoveredItemProps {
  animatedRef: AnimatedRef<Animated.View>;
  hoveredItemMounted: SharedValue<boolean>;
  hoveredItemJSX: JSX.Element;
  hoveredItemMeta: SharedValue<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
}

export function HoveredItem(props: HoveredItemProps) {
  const { animatedRef, hoveredItemMounted, hoveredItemJSX, hoveredItemMeta } =
    props;

  const style = useAnimatedStyle(
    () => ({
      position: 'absolute',
      width: hoveredItemMeta.value.width,
      height: hoveredItemMeta.value.height,
      top: hoveredItemMeta.value.y,
      left: hoveredItemMeta.value.x,
    }),
    [hoveredItemMeta]
  );

  useEffect(() => {
    hoveredItemMounted.value = true;
    return () => {
      hoveredItemMounted.value = false;
    };
  }, [animatedRef, hoveredItemMounted, hoveredItemJSX]);

  return (
    <Animated.View ref={animatedRef} style={style}>
      {hoveredItemJSX}
    </Animated.View>
  );
}

function useHoveredItemAutoScroll(
  animatedRef: AnimatedRef<Animated.View>,
  hoveredItemMounted: SharedValue<boolean>,
  hoveredItemMeta: SharedValue<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>
) {
  const { startScroll, stopScroll } = useContext(AutoScrollRootContext);

  useDerivedValue(() => {
    if (!hoveredItemMounted.value) {
      stopScroll();
      return;
    }

    const measurement = measure(animatedRef);
    if (measurement != null) {
      startScroll(measurement);
    }
  }, [
    animatedRef,
    hoveredItemMounted,
    hoveredItemMeta,
    startScroll,
    stopScroll,
  ]);
}
