/* eslint-disable react-native/no-inline-styles */
import * as React from 'react';
import { useCallback, useState } from 'react';

import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import DraggableFlatList, {
  ScaleDecorator,
  type RenderItemParams,
} from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedRef,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import * as D3 from './DragDrop';
import { DragDropFlatList } from './DragDropFlatList';
import {
  DragDropListRoot,
  useDragDrop,
  type DragDropListItemType,
  type DragDropRenderItem,
} from './DragDropList';
import {
  AutoScrollContextProvider,
  AutoScrollScrollView,
} from './DragDropScroll';
import { DragDropScrollView } from './DragDropScrollView';
import { DragDropView } from './DragDropView';
import { HoveredItemContextProvider } from './HoveredItem';

export default function App() {
  const [t, sT] = useState(true);

  const [type] = useState(0);

  return (
    <GestureHandlerRootView style={styles.container}>
      <AutoScrollContextProvider>
        <HoveredItemContextProvider>
          <D3.DragDropContextProvider>
            <DragDropListRoot>
              <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                  <Pressable onPress={() => sT((t1) => !t1)}>
                    <Text>Header</Text>
                  </Pressable>
                </View>
                {t && type === 0 && <Content5 />}
                {t && type === 1 && <Content4 />}
                {t && type === 2 && <Content3 />}
                {t && type === 3 && <Content2 />}
                {t && type === 4 && <Content />}
                <View style={styles.footer}>
                  <Text>Footer</Text>
                </View>
              </SafeAreaView>
            </DragDropListRoot>
          </D3.DragDropContextProvider>
        </HoveredItemContextProvider>
      </AutoScrollContextProvider>
    </GestureHandlerRootView>
  );
}

//! Content 5

interface Content5Item {
  id: string;
  text: string;
  color: string;
}

function Content5() {
  const [items1] = useState<Content5Item[]>(() =>
    Array.from({ length: 15 }).map((_, i) => ({
      id: `r${i + 1}`,
      text: Array.from({ length: i + 1 })
        .map(() => i.toString())
        .join(' | '),
      color: '#FBE1E1',
    }))
  );
  const [items2] = useState<Content5Item[]>(() =>
    Array.from({ length: 15 }).map((_, i) => ({
      id: `b${i + 1}`,
      text: Array.from({ length: i + 1 })
        .map(() => i.toString())
        .join(' | '),
      color: '#93B5F6',
    }))
  );

  const renderItem = useCallback<D3.DragDropRenderItem<Content5Item>>(
    (item, isActive, drag) => (
      <MyItem
        item={item}
        color={item.data.color}
        isActive={isActive}
        drag={drag}
      />
    ),
    []
  );

  const extractId = useCallback((item: Content5Item) => item.id, []);

  return (
    <AutoScrollScrollView style={[styles.content]}>
      <View style={{ paddingTop: 8 }}>
        <DragDropView
          items={[]}
          onChange={() => {}}
          renderItem={renderItem}
          extractId={extractId}
          style={{
            minHeight: 100,
            borderWidth: 1,
            borderColor: '#E0E1E6',
            borderRadius: 8,
          }}
          groupId="1"
        />
      </View>
      <View style={{ flexDirection: 'row' }}>
        <View style={{ flex: 1, paddingHorizontal: 12 }}>
          <DragDropView
            items={items1}
            onChange={() => {}}
            renderItem={renderItem}
            extractId={extractId}
            groupId="1"
          />
        </View>
        {/* <DragDropView
        items={items2}
        onChange={() => {}}
        renderItem={renderItem}
        extractId={extractId}
        style={styles.content}
      /> */}
        <View style={{ flex: 1, paddingHorizontal: 12 }}>
          <DragDropView
            items={items2}
            onChange={() => {}}
            renderItem={renderItem}
            extractId={extractId}
            groupId="1"
          />
        </View>
      </View>
    </AutoScrollScrollView>
  );
}

//! Content 4

interface Content4Item {
  id: string;
  text: string;
}

function Content4() {
  const [items] = useState<Content4Item[]>(
    Array.from({ length: 100 }).map((_, i) => ({
      id: (i + 1).toString(),
      text: ''.padEnd(i + 1, (i + 1).toString()),
    }))
  );

  const renderItem = useCallback<D3.DragDropRenderItem<Content3Item>>(
    (item, isActive, drag) => (
      <MyItem item={item} isActive={isActive} drag={drag} />
    ),
    []
  );

  const extractId = useCallback((item: Content3Item) => item.id, []);

  return (
    <DragDropFlatList
      items={items}
      onChange={() => {}}
      renderItem={renderItem}
      extractId={extractId}
      style={styles.content}
    />
  );
}

//! Content 3

interface Content3Item {
  id: string;
  text: string;
}

function Content3() {
  const [items] = useState<Content3Item[]>(
    Array.from({ length: 100 }).map((_, i) => ({
      id: (i + 1).toString(),
      text: ''.padEnd(i + 1, (i + 1).toString()),
    }))
  );

  const renderItem = useCallback<D3.DragDropRenderItem<Content3Item>>(
    (item, isActive, drag) => (
      <MyItem item={item} isActive={isActive} drag={drag} />
    ),
    []
  );

  const extractId = useCallback((item: Content3Item) => item.id, []);

  return (
    <DragDropScrollView
      items={items}
      onChange={() => {}}
      renderItem={renderItem}
      extractId={extractId}
      style={styles.content}
    />
  );
}

//! Content 2

const NUM_ITEMS = 10;

function getColor(i: number) {
  const multiplier = 255 / (NUM_ITEMS - 1);
  const colorVal = i * multiplier;
  return `rgb(${colorVal}, ${Math.abs(128 - colorVal)}, ${255 - colorVal})`;
}

type Item = {
  key: string;
  label: string;
  height: number;
  width: number;
  backgroundColor: string;
};

const initialData: Item[] = [...Array(NUM_ITEMS)].map((_, index) => {
  const backgroundColor = getColor(index);
  return {
    key: `item-${index}`,
    label: String(index) + '',
    height: 100,
    width: 60 + Math.random() * 40,
    backgroundColor,
  };
});

function Content2() {
  const [data, setData] = useState(initialData);

  const renderItem = ({ item, drag, isActive }: RenderItemParams<Item>) => {
    return (
      <ScaleDecorator>
        <TouchableOpacity
          onLongPress={drag}
          disabled={isActive}
          style={[
            {
              height: 100,
              width: 100,
              alignItems: 'center',
              justifyContent: 'center',
            },
            { backgroundColor: isActive ? 'red' : item.backgroundColor },
          ]}
        >
          <Text
            style={{
              color: 'white',
              fontSize: 24,
              fontWeight: 'bold',
              textAlign: 'center',
            }}
          >
            {item.label}
          </Text>
        </TouchableOpacity>
      </ScaleDecorator>
    );
  };

  return (
    <View style={styles.content}>
      <DraggableFlatList
        data={data}
        onDragEnd={({ data: dataLocal }) => setData(dataLocal)}
        keyExtractor={(item) => item.key}
        renderItem={renderItem}
      />
    </View>
  );
}

//! Content

function Content() {
  const [items] = useState<DragDropListItemType<MyItemType>[]>(
    Array.from({ length: 50 }).map((_, i) => ({
      id: (i + 1).toString(),
      data: {
        text: ''.padEnd(i + 1, (i + 1).toString()),
      },
    }))
  );

  const renderItem = useCallback<DragDropRenderItem<MyItemType>>(
    (item, isActive, drag) => (
      <MyItem item={item} isActive={isActive} drag={drag} />
    ),
    []
  );

  const areaRef = useAnimatedRef<Animated.ScrollView>();

  const { items: dragItems, renderDragDropItem } = useDragDrop(
    areaRef,
    items,
    renderItem
  );

  // console.log(items.map((item) => item.id));

  // return (
  //   <ScrollView ref={areaRef} style={styles.content}>
  //     {dragItems.map((item) => renderDragDropItem(item))}
  //   </ScrollView>
  // );

  return (
    <AutoScrollScrollView innerRef={areaRef} style={styles.content}>
      {dragItems.map((item) => renderDragDropItem(item))}
    </AutoScrollScrollView>
  );
}

interface MyItemType {
  text: string;
}

interface MyItemProps {
  item: DragDropListItemType<MyItemType>;
  isActive: SharedValue<boolean>;
  color?: string;
  drag: () => void;
}

function MyItem(props: MyItemProps) {
  const { item, isActive, color, drag } = props;

  const animStyle = useAnimatedStyle(
    () => ({
      borderColor: isActive.value ? '#5638C7' : '#E0E1E6',
      borderWidth: 2,
      borderRadius: 8,
      marginVertical: 8,
      padding: 8,
      // backgroundColor: '#E0E1E6',
      backgroundColor: isActive.value ? '#E6E1F7' : color ?? 'white',
    }),
    [isActive, color]
  );

  return (
    <Animated.View style={animStyle}>
      <Pressable onLongPress={drag}>
        <Text>{item.data.text}</Text>
      </Pressable>
    </Animated.View>
  );
}

// interface DragDropListRootContextType {
//   animatedRef?: AnimatedRef<Animated.View>;
//   setActiveItem: (
//     itemJSX: JSX.Element,
//     size: { width: number; height: number },
//     position: { x: number; y: number }
//   ) => void;
//   changePosition: (x: number, y: number) => void;
//   clearActiveItem: () => void;
// }

// const DragDropListRootContext =
//   React.createContext<DragDropListRootContextType>({
//     setActiveItem: () => {},
//     changePosition: () => {},
//     clearActiveItem: () => {},
//   });

// type DragDropListRootProps = React.PropsWithChildren<{}>;

// function DragDropListRoot(props: DragDropListRootProps) {
//   const { children } = props;

//   // shared value thread race
//   const prevLayoutExists = useSharedValue(false);
//   const [layoutExists, setLayoutExists] = useState(false);
//   const [activeItemJSX, setActiveItemJSX] = useState<JSX.Element | null>(null);
//   const activeItemSize = useSharedValue<{
//     width: number;
//     height: number;
//   } | null>(null);
//   const activeItemPosition = useSharedValue<{ x: number; y: number } | null>(
//     null
//   );

//   useDerivedValue(() => {
//     const layoutExistsLocal =
//       activeItemSize.value != null && activeItemPosition.value != null;
//     if (prevLayoutExists.value !== layoutExistsLocal) {
//       runOnJS(setLayoutExists)(layoutExistsLocal);
//       prevLayoutExists.value = layoutExistsLocal;
//     }
//   }, []);

//   const setActiveItem = useCallback<
//     DragDropListRootContextType['setActiveItem']
//   >(
//     (itemJSX, size, position) => {
//       setActiveItemJSX(itemJSX);
//       activeItemSize.value = size;
//       activeItemPosition.value = position;
//     },
//     [activeItemPosition, activeItemSize]
//   );
//   const clearActiveItem = useCallback(() => {
//     setActiveItemJSX(null);
//     activeItemSize.value = null;
//     activeItemPosition.value = null;
//   }, [activeItemPosition, activeItemSize]);
//   const changePosition = useCallback(
//     (x: number, y: number) => {
//       'worklet';
//       activeItemPosition.value = {
//         x: (activeItemPosition.value?.x ?? 0) + x,
//         y: (activeItemPosition.value?.y ?? 0) + y,
//       };
//     },
//     [activeItemPosition]
//   );

//   const animatedRef = useAnimatedRef<Animated.View>();

//   const value = useMemo<DragDropListRootContextType>(
//     () => ({ animatedRef, setActiveItem, changePosition, clearActiveItem }),
//     [animatedRef, setActiveItem, changePosition, clearActiveItem]
//   );

//   return (
//     <DragDropListRootContext.Provider value={value}>
//       {children}
//       {activeItemJSX == null || !layoutExists || (
//         <DragDropListMovedItem
//           animatedRef={animatedRef}
//           activeItemJSX={activeItemJSX}
//           activeItemSize={activeItemSize}
//           activeItemPosition={activeItemPosition}
//         />
//       )}
//     </DragDropListRootContext.Provider>
//   );
// }

// interface DragDropListMovedItemProps {
//   animatedRef: AnimatedRef<Animated.View>;
//   activeItemJSX: JSX.Element;
//   activeItemSize: SharedValue<{
//     width: number;
//     height: number;
//   } | null>;
//   activeItemPosition: SharedValue<{
//     x: number;
//     y: number;
//   } | null>;
// }

// function DragDropListMovedItem(props: DragDropListMovedItemProps) {
//   const { animatedRef, activeItemJSX, activeItemSize, activeItemPosition } =
//     props;

//   const animStyle = useAnimatedStyle(
//     () => ({
//       position: 'absolute',
//       left: activeItemPosition.value?.x,
//       top: activeItemPosition.value?.y,
//       width: activeItemSize.value?.width,
//       height: activeItemSize.value?.height,
//     }),
//     []
//   );

//   return (
//     <Animated.View ref={animatedRef} style={animStyle}>
//       {activeItemJSX}
//     </Animated.View>
//   );
// }

// type DragDropListItemType<T extends object> = { id: string | number } & T;

// interface DragDropListProps<T extends object> {
//   items: DragDropListItemType<T>[];
//   renderItem: (
//     item: DragDropListItemType<T>,
//     isActive: SharedValue<boolean>
//   ) => JSX.Element;
//   onChange?: (items: DragDropListItemType<T>[]) => void;
// }

// function DragDropList<T extends object>(props: DragDropListProps<T>) {
//   const { items: itemsProps, renderItem, onChange } = props;

//   const [items, setItems] = useState([...itemsProps]);

//   const itemsOffset = useSharedValue<{
//     from: number;
//     to: number;
//     offset: { x: number; y: number };
//   } | null>(null);
//   const movedIndex = useSharedValue<number | null>(null);
//   const itemsIds = useSharedValue(items.map((item) => item.id));

//   const prevUpdateId = useSharedValue(-1);
//   const updateId = useSharedValue(-1);
//   const updateItems = useCallback(
//     (idsSorted: (number | string)[]) => {
//       onChange?.(
//         idsSorted
//           .map((id) => items.find((item) => item.id === id))
//           .filter((item): item is DragDropListItemType<T> => item != null)
//       );
//     },
//     [items, onChange]
//   );
//   useDerivedValue(() => {
//     if (updateId.value !== prevUpdateId.value) {
//       prevUpdateId.value = updateId.value;
//       itemsOffset.value = null;
//       runOnJS(updateItems)(itemsIds.value);
//     }
//   }, [updateItems]);

//   const inited = useSharedValue(false);
//   const itemsSize = useSharedValue<{ width: number; height: number }[]>([]);
//   const { animatedRef: rootItemAnimatedRef } = useContext(
//     DragDropListRootContext
//   );

//   const itemsCount = items.length;
//   const onSize = useCallback(
//     (index: number, width: number, height: number) => {
//       'worklet';
//       // console.log('OnSize:', index);
//       const newItemsSize = [...itemsSize.value];

//       const emptyCount = index - newItemsSize.length + 1;
//       if (emptyCount > 0) {
//         newItemsSize.push(
//           ...Array.from({ length: emptyCount }).map(() => ({
//             width: -1,
//             height: -1,
//           }))
//         );
//       }

//       newItemsSize[index] = { width, height };
//       itemsSize.value = newItemsSize;

//       if (
//         newItemsSize.length >= itemsCount &&
//         !inited.value &&
//         newItemsSize.every((s) => s.width > -1)
//       ) {
//         inited.value = true;
//       }
//     },
//     [inited, itemsCount, itemsSize]
//   );

//   const handlersRef = useRef<{
//     [key: string | number]: DragDropListItemHandle;
//   }>({});
//   const handlers = useSharedValue<{
//     [key: string | number]: DragDropListItemHandle;
//   }>({});
//   const itemsAnimatedRef = useSharedValue<{
//     [key: string | number]: AnimatedRef<Animated.View>;
//   }>({});
//   const onHandle = useCallback(
//     (
//       index: number,
//       item: DragDropListItemType<T>,
//       animatedRef?: AnimatedRef<Animated.View>,
//       handler?: DragDropListItemHandle
//     ) => {
//       // console.log(
//       //   '\n\n=====================',
//       //   '\nOnHandle START:',
//       //   '\nID:',
//       //   item.id,
//       //   '\nREF:',
//       //   Object.keys(handlersRef.current),
//       //   '\nSHARED:',
//       //   Object.keys(handlers.value),
//       //   '\nHANDLER:',
//       //   handler == null,
//       //   '\n=====================\n\n'
//       // );
//       if (handler == null || animatedRef == null) {
//         delete handlersRef.current[item.id];
//         handlers.value = { ...handlersRef.current };
//         delete itemsAnimatedRef.value[item.id];
//         itemsAnimatedRef.value = { ...itemsAnimatedRef.value };
//       } else {
//         handlersRef.current[item.id] = handler;
//         handlers.value = { ...handlersRef.current };
//         itemsAnimatedRef.value = {
//           ...itemsAnimatedRef.value,
//           [item.id]: animatedRef,
//         };
//       }
//       // console.log(
//       //   '\n\n=====================',
//       //   '\nOnHandle END:',
//       //   '\nID:',
//       //   item.id,
//       //   '\nTEST:',
//       //   Object.keys({ ...handlersRef.current }),
//       //   '\nREF:',
//       //   Object.keys(handlersRef.current),
//       //   '\nSHARED:',
//       //   Object.keys(handlers.value),
//       //   '\nHANDLER:',
//       //   handler == null,
//       //   '\nANIMATEDREF:',
//       //   Object.keys(itemsAnimatedRef.value),
//       //   '\n=====================\n\n'
//       // );
//     },
//     [handlers, itemsAnimatedRef]
//   );

//   const moveItem = useCallback((from: number, to: number) => {
//     setItems((itemsLocal) => move(itemsLocal, from, to));
//   }, []);

//   const onMove = useCallback(
//     (originIndex: number, id: number | string) => {
//       'worklet';
//       if (rootItemAnimatedRef == null) {
//         return;
//       }

//       // const index = movedIndex.value ?? originIndex;
//       const index = itemsIds.value.findIndex((idLocal) => idLocal === id);
//       const currHandler = handlers.value[id];
//       const currMeasurement = currHandler?.measure();
//       const rootMeasurement = measure(rootItemAnimatedRef);
//       // console.log('FIRST', id, Object.keys(handlers.value));
//       if (currMeasurement == null || rootMeasurement == null) {
//         return;
//       }
//       const prevHandler = handlers.value[itemsIds.value[index - 1] ?? ''];
//       const nextHandler = handlers.value[itemsIds.value[index + 1] ?? ''];
//       const prevMeasurement = prevHandler?.measure();
//       const nextMeasurement = nextHandler?.measure();
//       // console.log(
//       //   'SECOND',
//       //   movedIndex,
//       //   prevHandler == null,
//       //   currMeasurement,
//       //   prevMeasurement
//       // );
//       if (
//         prevHandler != null &&
//         prevMeasurement != null &&
//         currHandler != null
//       ) {
//         const endY = currMeasurement.pageY + currMeasurement.height;
//         const minY = prevMeasurement.pageY + prevMeasurement.height / 2;
//         // console.log(
//         //   'OnMove:\n',
//         //   currMeasurement,
//         //   '\n',
//         //   rootMeasurement,
//         //   '\n',
//         //   prevMeasurement,
//         //   '\n',
//         //   endY,
//         //   minY
//         // );
//         if (rootMeasurement.pageY <= minY) {
//           // console.log(
//           //   'OnMovePrev:\n',
//           //   index,
//           //   '\n',
//           //   currMeasurement,
//           //   '\n',
//           //   rootMeasurement,
//           //   '\n',
//           //   prevMeasurement,
//           //   '\n',
//           //   endY,
//           //   minY
//           // );
//           const newIndex = index - 1;
//           // (() => {
//           //   if (itemsOffset.value == null) {
//           //     itemsOffset.value = {
//           //       from: index,
//           //       to: index,
//           //       offset: { x: 0, y: currMeasurement.height },
//           //     };
//           //   } else {
//           //     if (itemsOffset.value.from >= newIndex) {
//           //       itemsOffset.value = {
//           //         from: index,
//           //         to: itemsOffset.value.to,
//           //         offset: { x: 0, y: currMeasurement.height },
//           //       };
//           //     } else {
//           //       itemsOffset.value = {
//           //         from: index,
//           //         to: itemsOffset.value.to,
//           //         offset: { x: 0, y: currMeasurement.height },
//           //       };
//           //     }
//           //   }
//           // })();
//           // // prevHandler.move(0, currMeasurement.height);
//           // currHandler.move(0, -prevMeasurement.height);
//           movedIndex.value = newIndex;
//           itemsIds.value = move(itemsIds.value, index, index - 1);
//           runOnJS(moveItem)(index, index - 1);
//         }
//       }
//       if (
//         nextHandler != null &&
//         nextMeasurement != null &&
//         currHandler != null
//       ) {
//         const endY = currMeasurement.pageY + currMeasurement.height;
//         const minY = nextMeasurement.pageY + nextMeasurement.height / 2;
//         // console.log(
//         //   'OnMove:\n',
//         //   currMeasurement,
//         //   '\n',
//         //   rootMeasurement,
//         //   '\n',
//         //   nextMeasurement,
//         //   '\n',
//         //   endY,
//         //   minY
//         // );
//         if (rootMeasurement.pageY + rootMeasurement.height > minY) {
//           // console.log(
//           //   'OnMoveNext:\n',
//           //   index,
//           //   '\n',
//           //   currMeasurement,
//           //   '\n',
//           //   rootMeasurement,
//           //   '\n',
//           //   nextMeasurement,
//           //   '\n',
//           //   endY,
//           //   minY
//           // );
//           // (() => {
//           //   if (itemsOffset.value == null) {
//           //     itemsOffset.value = {
//           //       from: index + 1,
//           //       to: index + 1,
//           //       offset: { x: 0, y: currMeasurement.height },
//           //     };
//           //   } else {
//           //     if (itemsOffset.value.to <= index + 1) {
//           //       itemsOffset.value = {
//           //         from: index + 1,
//           //         to: itemsOffset.value.to,
//           //         offset: { x: 0, y: currMeasurement.height },
//           //       };
//           //     } else {
//           //       itemsOffset.value = {
//           //         from: itemsOffset.value.from,
//           //         to: index + 1,
//           //         offset: { x: 0, y: currMeasurement.height },
//           //       };
//           //     }
//           //   }
//           // })();
//           // currHandler.move(0, nextMeasurement.height);
//           movedIndex.value = index + 1;
//           itemsIds.value = move(itemsIds.value, index, index + 1);
//           runOnJS(moveItem)(index, index + 1);
//         }
//       }
//     },
//     [rootItemAnimatedRef, itemsIds, handlers, movedIndex, moveItem]
//   );

//   const animStyle = useAnimatedStyle(() => {
//     if (inited.value) {
//       const { width, height } = itemsSize.value.reduce(
//         (sizeSum, size) => ({
//           width: Math.max(sizeSum.width, size.width),
//           height: sizeSum.height + size.height,
//         }),
//         { width: 0, height: 0 }
//       );
//       return {
//         width,
//         height,
//       };
//     }
//     return {
//       width: 'auto',
//       height: 'auto',
//     };
//   }, [itemsSize, inited]);

//   return (
//     <Animated.View style={animStyle}>
//       {items.map((item) => (
//         <DragDropListItem
//           key={item.id}
//           item={item}
//           updateId={updateId}
//           itemsOffset={itemsOffset}
//           itemsIds={itemsIds}
//           onMove={onMove}
//           onHandle={onHandle}
//           onSize={onSize}
//           renderItem={renderItem}
//         />
//       ))}
//     </Animated.View>
//   );
// }

// export type DragDropListItemHandle = {
//   move: (x: number, y: number) => void;
//   measure: () => MeasuredDimensions | null;
// };

// interface DragDropListItemProps<T extends object> {
//   item: DragDropListItemType<T>;
//   updateId: SharedValue<number>;
//   itemsOffset: SharedValue<{
//     from: number;
//     to: number;
//     offset: { x: number; y: number };
//   } | null>;
//   itemsIds: SharedValue<(string | number)[]>;
//   onMove: (originIndex: number, id: number | string) => void;
//   onHandle: (
//     index: number,
//     item: DragDropListItemType<T>,
//     animatedRef?: AnimatedRef<Animated.View>,
//     handler?: DragDropListItemHandle
//   ) => void;
//   onSize: (index: number, width: number, height: number) => void;
//   renderItem: (
//     item: DragDropListItemType<T>,
//     isActive: SharedValue<boolean>
//   ) => JSX.Element;
// }

// function DragDropListItem<T extends object>(props: DragDropListItemProps<T>) {
//   const {
//     item,
//     updateId,
//     itemsOffset,
//     itemsIds,
//     onMove,
//     onHandle,
//     onSize,
//     renderItem,
//   } = props;

//   const isActive = useSharedValue(false);

//   const indexAnim = useDerivedValue(
//     () => itemsIds.value.findIndex((id) => id === item.id),
//     [itemsIds, item]
//   );

//   const size = useSharedValue<{ width: number; height: number } | null>(null);
//   useDerivedValue(() => {
//     if (size.value != null) {
//       onSize(indexAnim.value, size.value.width, size.value.height);
//     }
//   }, [indexAnim, size, onSize]);

//   const jsx = useMemo(
//     () => renderItem(item, isActive),
//     [isActive, item, renderItem]
//   );

//   const translate = useSharedValue({ x: 0, y: 0 });
//   const translateAnim = useSharedValue({ x: 0, y: 0 });

//   const setTransition = useCallback(
//     (x: number, y: number, animation: boolean = true) => {
//       'worklet';

//       translate.value = {
//         x,
//         y,
//       };
//       if (animation) {
//         translateAnim.value = {
//           x: withTiming(translate.value.x, { duration: 200 }),
//           y: withTiming(translate.value.y, { duration: 200 }),
//         };
//       } else {
//         translateAnim.value = {
//           ...translate.value,
//         };
//       }
//     },
//     [translate, translateAnim]
//   );

//   const animatedRef = useAnimatedRef<Animated.View>();

//   useEffect(() => {
//     console.log('RENDER', indexAnim.value);
//   }, [indexAnim]);

//   const prevIndex = useSharedValue(-1);
//   const prevMeasure = useSharedValue({ x: Number.NaN, y: Number.NaN });
//   // useDerivedValue(() => {
//   //   if (prevIndex.value === indexAnim.value) {
//   //     return;
//   //   }
//   //   const measurement = measure(animatedRef);
//   //   if (measurement == null) {
//   //     return;
//   //   }
//   //   // console.log('MEASURE', indexAnim.value, prevMeasure.value, measurement);
//   //   if (!Number.isNaN(prevMeasure.value.x)) {
//   //     const deltaX = prevMeasure.value.x - measurement.x;
//   //     const deltaY = prevMeasure.value.y - measurement.y;
//   //     // console.log(
//   //     //   'OnIndexChange',
//   //     //   prevIndex.value,
//   //     //   indexAnim.value,
//   //     //   '\n',
//   //     //   deltaX,
//   //     //   deltaY
//   //     // );
//   //     translate.value = {
//   //       x: 0,
//   //       y: 0,
//   //     };
//   //     translateAnim.value = {
//   //       x: withSequence(
//   //         withTiming(deltaX, { duration: 0 }),
//   //         withTiming(0, { duration: 2000 })
//   //       ),
//   //       y: withSequence(
//   //         withTiming(deltaY, { duration: 0 }),
//   //         withTiming(0, { duration: 2000 })
//   //       ),
//   //     };
//   //     // setTransition(deltaX, deltaY, false);
//   //     // setTransition(0, 0);
//   //   }
//   //   prevIndex.value = indexAnim.value;
//   //   prevMeasure.value = { x: measurement.x, y: measurement.y };
//   // }, [indexAnim]);

//   const wasActive = useSharedValue(false);
//   useDerivedValue(() => {
//     // if (isActive.value) {
//     //   wasActive.value = true;
//     //   return;
//     // }
//     // if (wasActive.value) {
//     //   if (itemsOffset.value == null) {
//     //     wasActive.value = false;
//     //   } else {
//     //     return;
//     //   }
//     // }
//     // if (
//     //   itemsOffset.value != null &&
//     //   itemsOffset.value.from <= indexAnim.value &&
//     //   itemsOffset.value.to >= indexAnim.value
//     // ) {
//     //   const offset = itemsOffset.value.offset;
//     //   setTransition(offset.x, offset.y);
//     // } else {
//     //   setTransition(0, 0, false);
//     // }
//   }, []);

//   const contextRoot = useContext(DragDropListRootContext);

//   const setActiveItem = useCallback(
//     (measurement: MeasuredDimensions) => {
//       contextRoot.setActiveItem(
//         jsx,
//         { width: measurement.width, height: measurement.height },
//         { x: measurement.pageX, y: measurement.pageY }
//       );
//     },
//     [contextRoot, jsx]
//   );
//   const changePosition = contextRoot.changePosition;
//   const clearActiveItem = contextRoot.clearActiveItem;

//   const itemId = item.id;
//   const gesture = useMemo(
//     () =>
//       Gesture.Pan()
//         .activateAfterLongPress(300)
//         .onStart(() => {
//           isActive.value = true;
//           const measurement = measure(animatedRef);
//           if (measurement != null) {
//             runOnJS(setActiveItem)(measurement);
//           }
//         })
//         .onChange((e) => {
//           changePosition(e.changeX, e.changeY);
//           onMove(indexAnim.value, itemId);
//         })
//         .onFinalize(() => {
//           isActive.value = false;
//           updateId.value = updateId.value + 1;
//           runOnJS(clearActiveItem)();
//         }),
//     [
//       isActive,
//       animatedRef,
//       setActiveItem,
//       changePosition,
//       onMove,
//       indexAnim,
//       itemId,
//       updateId,
//       clearActiveItem,
//       setTransition,
//     ]
//   );

//   const moveLocal = useCallback(
//     (x: number, y: number) => {
//       'worklet';

//       // setTransition(translate.value.x + x, translate.value.y + y);
//     },
//     [setTransition, translate]
//   );

//   const measureLocal = useCallback(() => {
//     'worklet';
//     const measurement = measure(animatedRef);
//     if (measurement == null) {
//       return null;
//     }
//     return {
//       ...measurement,
//       pageX:
//         measurement.pageX +
//         getDeltaAnim(translate.value.x, translateAnim.value.x),
//       pageY:
//         measurement.pageY +
//         getDeltaAnim(translate.value.y, translateAnim.value.y),
//     };
//   }, [animatedRef, translate, translateAnim]);

//   useEffect(() => {
//     onHandle(indexAnim.value, item, animatedRef, {
//       move: moveLocal,
//       measure: measureLocal,
//     });

//     return () => {
//       onHandle(indexAnim.value, item);
//     };
//   }, [animatedRef, indexAnim, item, measureLocal, moveLocal, onHandle]);

//   const animStyle = useAnimatedStyle(
//     () => ({
//       transform: [
//         { translateX: translateAnim.value.x },
//         { translateY: translateAnim.value.y },
//       ],
//       // zIndex: isActive.value ? 10 : 1,
//     }),
//     [isActive]
//   );

//   // useDerivedValue(() => {
//   //   console.log(indexAnim.value, translate.value, itemsOffset.value);
//   // }, []);

//   return (
//     <GestureDetector gesture={gesture}>
//       <Animated.View
//         ref={animatedRef}
//         style={animStyle}
//         onLayout={({
//           nativeEvent: {
//             layout: { width, height },
//           },
//         }) => {
//           size.value = { width, height };
//         }}
//         layout={SharedT}
//       >
//         {jsx}
//       </Animated.View>
//     </GestureDetector>
//   );
// }

// function getDeltaAnim(value: number, animValue: unknown) {
//   'worklet';
//   if (typeof animValue === 'number') {
//     return value - animValue;
//   }
//   if (
//     typeof animValue === 'object' &&
//     animValue != null &&
//     'current' in animValue &&
//     typeof animValue.current === 'number'
//   ) {
//     return value - animValue.current;
//   }
//   return 0;
// }

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'stretch',
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderColor: '#919399',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: '#919399',
  },
  box: {
    width: 60,
    height: 60,
    marginVertical: 20,
  },
});
