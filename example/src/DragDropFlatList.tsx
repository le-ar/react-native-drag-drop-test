import React, { useCallback, useContext, useEffect, useMemo } from 'react';
import type { FlatListProps, ListRenderItem } from 'react-native';
import type { FlatList } from 'react-native-gesture-handler';
import Animated, {
  LinearTransition,
  useAnimatedRef,
  useSharedValue,
  type AnimatedRef,
  type SharedValue,
} from 'react-native-reanimated';
import type {
  DragDropItemType,
  DragDropRenderItem,
  useDragDropAreaReturn,
} from './DragDrop';
import { AutoScrollFlatList } from './DragDropScroll';
import { useDragDropList } from './useDragDropList';

export interface DragDropFlatListProps<T>
  extends Omit<
    FlatListProps<DragDropItemType<T>>,
    'ref' | 'data' | 'renderItem'
  > {
  groupId?: string;
  items: T[];
  onChange: (items: T[], from: number, to: number) => void;
  innerRef?: AnimatedRef<FlatList<DragDropItemType<T>>>;
  renderItem: DragDropRenderItem<T>;
  extractId: (item: T) => number | string;
}

export function DragDropFlatList<T>(props: DragDropFlatListProps<T>) {
  const {
    groupId,
    items: initialItems,
    innerRef,
    renderItem,
    extractId,
    onChange,
    ...otherProps
  } = props;

  const animatedRef = useAnimatedRef<FlatList<DragDropItemType<T>>>();
  const areaRef = innerRef ?? animatedRef;

  const { items, renderDragDropItem, onTransitionDone } = useDragDropList(
    areaRef,
    initialItems,
    onChange,
    renderItem,
    extractId,
    groupId
  );

  const renderItemLocal = useCallback<ListRenderItem<DragDropItemType<T>>>(
    ({ item, index }) => (
      <ListItem
        key={item.id}
        index={index}
        item={item}
        renderDragDropItem={renderDragDropItem}
      />
    ),
    [renderDragDropItem]
  );

  const CellRendererComponents = React.useCallback(
    (propsLocal: Omit<CellRendererComponentProps, 'onTransitionDone'>) => (
      <CellRendererComponent {...propsLocal} />
    ),
    []
  );

  const value = useMemo(() => ({ onTransitionDone }), [onTransitionDone]);

  return (
    <DragDropFlatListContext.Provider value={value}>
      <AutoScrollFlatList
        {...otherProps}
        innerRef={areaRef}
        data={items}
        keyExtractor={(i) => i.id.toString()}
        renderItem={renderItemLocal}
        CellRendererComponent={CellRendererComponents}
      />
    </DragDropFlatListContext.Provider>
  );
}

interface DragDropFlatListContextType {
  onTransitionDone: (id: string | number) => void;
}

const DragDropFlatListContext =
  React.createContext<DragDropFlatListContextType>({
    onTransitionDone: () => {},
  });

interface CellRendererComponentContextType {
  setItemId: (id: string | number) => void;
}

const CellRendererComponentContext =
  React.createContext<CellRendererComponentContextType>({
    setItemId: () => {
      console.log('NOW');
    },
  });

interface CellRendererComponentProps {
  children: React.ReactNode;
}

function CellRendererComponent(props: CellRendererComponentProps) {
  const { children } = props;

  const context = useContext(DragDropFlatListContext);

  const itemId = useSharedValue<string | number | null>(null);
  const value = useMemo<CellRendererComponentContextType>(
    () => ({
      setItemId: (id) => {
        itemId.value = id;
      },
    }),
    [itemId]
  );

  return (
    <CellRendererComponentContext.Provider value={value}>
      <Animated.View
        layout={LinearTransition.withCallback((f) => {
          console.log(itemId.value, f);
          if (itemId.value != null && f) {
            context.onTransitionDone(itemId.value);
          }
        })}
      >
        {children}
      </Animated.View>
    </CellRendererComponentContext.Provider>
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

  const { setItemId } = useContext(CellRendererComponentContext);

  useEffect(() => {
    setItemId(item.id);
  }, [item.id, setItemId]);

  const indexAnim = useSharedValue(index);
  useEffect(() => {
    indexAnim.value = index;
  }, [index, indexAnim]);

  return renderDragDropItem(item, indexAnim) ?? null;
}
