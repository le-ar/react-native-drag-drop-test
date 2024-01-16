import React, { useEffect, type ComponentProps } from 'react';
import Animated, {
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
import { useDragDropList } from './useDragDropList';

export interface DragDropViewProps<T>
  extends Omit<ComponentProps<Animated.View>, 'ref'> {
  groupId?: string;
  items: T[];
  onChange: (items: T[], from: number, to: number) => void;
  innerRef?: AnimatedRef<Animated.View>;
  renderItem: DragDropRenderItem<T>;
  extractId: (item: T) => number | string;
}

export function DragDropView<T>(props: DragDropViewProps<T>) {
  const {
    groupId,
    items: initialItems,
    innerRef,
    renderItem,
    extractId,
    onChange,
    ...otherProps
  } = props;

  const animatedRef = useAnimatedRef<Animated.View>();
  const areaRef = innerRef ?? animatedRef;

  const { items, renderDragDropItem } = useDragDropList(
    areaRef,
    initialItems,
    onChange,
    renderItem,
    extractId,
    groupId
  );

  if (items.length < 2) {
    console.log('ITEMS', items);
  }

  return (
    <Animated.View ref={areaRef} {...otherProps}>
      {items.map((item, index) => (
        <ListItem
          key={item.id}
          index={index}
          item={item}
          renderDragDropItem={renderDragDropItem}
        />
      ))}
    </Animated.View>
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
