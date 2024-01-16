import React, { useEffect, type ComponentProps } from 'react';
import type { ScrollView } from 'react-native-gesture-handler';
import type Animated from 'react-native-reanimated';
import {
  useAnimatedRef,
  useSharedValue,
  type AnimatedRef,
  type SharedValue,
} from 'react-native-reanimated';
import {
  type DragDropItemType,
  type DragDropRenderItem,
  type useDragDropAreaReturn,
} from './DragDrop';
import { AutoScrollScrollView } from './DragDropScroll';
import { useDragDropList } from './useDragDropList';

export interface DragDropScrollViewProps<T>
  extends Omit<ComponentProps<ScrollView>, 'ref'> {
  groupId?: string;
  items: T[];
  onChange: (items: T[], from: number, to: number) => void;
  axis?: {
    horizontal?: boolean;
    vertical?: boolean;
  };
  innerRef?: AnimatedRef<Animated.ScrollView>;
  renderItem: DragDropRenderItem<T>;
  extractId: (item: T) => number | string;
}

export function DragDropScrollView<T>(props: DragDropScrollViewProps<T>) {
  const {
    groupId,
    items: initialItems,
    innerRef,
    renderItem,
    extractId,
    onChange,
    axis,
    ...otherProps
  } = props;

  const animatedRef = useAnimatedRef<Animated.ScrollView>();
  const areaRef = innerRef ?? animatedRef;

  const { items, renderDragDropItem } = useDragDropList(
    areaRef,
    initialItems,
    onChange,
    renderItem,
    extractId,
    {
      groupId,
      axis,
    }
  );

  return (
    <AutoScrollScrollView innerRef={areaRef} {...otherProps}>
      {items.map((item, index) => (
        <ListItem
          key={item.id}
          index={index}
          item={item}
          renderDragDropItem={renderDragDropItem}
        />
      ))}
    </AutoScrollScrollView>
  );
}

interface ListItemProps<T> {
  index: number;
  item: DragDropItemType<T>;
  renderDragDropItem: useDragDropAreaReturn<
    T,
    SharedValue<number>
  >['renderDragDropItem'];
}

function ListItem<T>(props: ListItemProps<T>) {
  const { index, item, renderDragDropItem } = props;

  const indexAnim = useSharedValue(index);
  useEffect(() => {
    indexAnim.value = index;
  }, [index, indexAnim]);

  return renderDragDropItem(item, indexAnim) ?? null;
}
