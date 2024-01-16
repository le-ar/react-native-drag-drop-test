import React, {
  Component,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Gesture, GestureDetector, State } from 'react-native-gesture-handler';
import type {
  AnimatedRef,
  MeasuredDimensions,
  SharedValue,
} from 'react-native-reanimated';
import Animated, {
  LinearTransition,
  measure,
  runOnJS,
  runOnUI,
  useAnimatedRef,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';
import { move } from 'react-native-redash';
import { AutoScrollRootContext } from './DragDropScroll';

export interface DragDropListRootContextType {
  animatedRef?: AnimatedRef<Animated.View>;
  setActiveItem: (
    dragDropAreaId: number,
    itemId: string | number,
    itemJSX: JSX.Element,
    size: { width: number; height: number },
    position: { x: number; y: number }
  ) => void;
  changePosition: (x: number, y: number) => void;
  clearActiveItem: () => void;
  getDragDropId: <TComponent extends Component>(
    handler: DragDropAreaHandler<TComponent>
  ) => number;
}

export const DragDropListRootContext =
  React.createContext<DragDropListRootContextType>({
    setActiveItem: () => {},
    changePosition: () => {},
    clearActiveItem: () => {},
    getDragDropId: () => -1,
  });

interface DragDropAreaHandler<TComponent extends Component> {
  areaRef: AnimatedRef<TComponent>;
  findIndex: (id: string | number) => number;
  measureByIndex: (index: number) => MeasuredDimensions | null;
  tryPut: (
    item: any,
    pageX: number,
    pageY: number,
    width: number,
    height: number
  ) => boolean;
  itemMoved: (id: string | number, rootMeasurement: MeasuredDimensions) => void;
}

interface DragDropItemHandler {
  itemRef: AnimatedRef<Animated.View>;
  measure: () => MeasuredDimensions | null;
}

export type DragDropListRootProps = React.PropsWithChildren<{}>;

export function DragDropListRoot(props: DragDropListRootProps) {
  const { children } = props;

  // shared value thread race
  const prevLayoutExists = useSharedValue(false);
  const [layoutExists, setLayoutExists] = useState(false);
  const [activeItemJSX, setActiveItemJSX] = useState<JSX.Element | null>(null);
  const activeItemSize = useSharedValue<{
    width: number;
    height: number;
  } | null>(null);
  const activeItemPosition = useSharedValue<{ x: number; y: number } | null>(
    null
  );

  const { stopScroll } = useContext(AutoScrollRootContext);
  useDerivedValue(() => {
    if (activeItemPosition.value == null) {
      stopScroll();
    }
  }, [stopScroll]);

  useDerivedValue(() => {
    const layoutExistsLocal =
      activeItemSize.value != null && activeItemPosition.value != null;
    if (prevLayoutExists.value !== layoutExistsLocal) {
      runOnJS(setLayoutExists)(layoutExistsLocal);
      prevLayoutExists.value = layoutExistsLocal;
    }
  }, []);

  const activeItemId = useSharedValue<number | string | null>(null);
  const activeDragDropAreaId = useSharedValue<number | null>(null);
  const setActiveItem = useCallback<
    DragDropListRootContextType['setActiveItem']
  >(
    (activeDragDropAreaIdLocal, itemId, itemJSX, size, position) => {
      activeDragDropAreaId.value = activeDragDropAreaIdLocal;
      setActiveItemJSX(itemJSX);
      activeItemSize.value = size;
      activeItemPosition.value = position;
      activeItemId.value = itemId;
    },
    [activeItemId, activeDragDropAreaId, activeItemPosition, activeItemSize]
  );

  const clearActiveItem = useCallback(() => {
    setActiveItemJSX(null);
    activeItemSize.value = null;
    activeItemPosition.value = null;
    activeItemId.value = null;
  }, [activeItemId, activeItemPosition, activeItemSize]);

  const changePosition = useCallback(
    (x: number, y: number) => {
      'worklet';
      activeItemPosition.value = {
        x: (activeItemPosition.value?.x ?? 0) + x,
        y: (activeItemPosition.value?.y ?? 0) + y,
      };
    },
    [activeItemPosition]
  );

  const movedItemRef = useAnimatedRef<Animated.View>();

  const dragDropAreasMap = useSharedValue<{
    [key: number]: DragDropAreaHandler<any>;
  }>({});
  const dragDropAreas = useSharedValue<
    { id: number; handler: DragDropAreaHandler<any> }[]
  >([]);

  const dragDropId = useRef(-1);
  const getDragDropId = useCallback(
    <TComponent extends Component>(
      handler: DragDropAreaHandler<TComponent>
    ) => {
      const id = ++dragDropId.current;
      dragDropAreas.value = [...dragDropAreas.value, { id, handler }];
      dragDropAreasMap.value = { ...dragDropAreasMap.value, [id]: handler };
      return id;
    },
    [dragDropAreas, dragDropAreasMap]
  );

  const value = useMemo<DragDropListRootContextType>(
    () => ({
      animatedRef: movedItemRef,
      setActiveItem,
      changePosition,
      clearActiveItem,
      getDragDropId,
    }),
    [
      movedItemRef,
      setActiveItem,
      changePosition,
      clearActiveItem,
      getDragDropId,
    ]
  );

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .manualActivation(true)
        .onStart(() => {})
        .onChange((e) => {
          if (
            activeItemId.value == null ||
            activeItemPosition.value == null ||
            activeItemSize.value == null
          ) {
            return;
          }
          const position = {
            x: activeItemPosition.value.x + e.changeX,
            y: activeItemPosition.value.y + e.changeY,
          };
          const size = {
            ...activeItemSize.value,
          };
          activeItemPosition.value = position;
          const overlapAreas = dragDropAreas.value.map((area, index) => {
            const measurement = measure(area.handler.areaRef);
            if (measurement == null) {
              return { index, overlap: 0 };
            }
            if (
              position.x > measurement.pageX + measurement.width ||
              position.x + size.width < measurement.pageX ||
              position.y > measurement.pageY + measurement.height ||
              position.y + size.height < measurement.pageY
            ) {
              return { index, overlap: 0 };
            }

            const xOverlap = Math.max(
              0,
              Math.min(
                position.x + size.width,
                measurement.pageX + measurement.width
              ) - Math.max(position.x, measurement.pageX)
            );
            const yOverlap = Math.max(
              0,
              Math.min(
                position.y + size.height,
                measurement.pageY + measurement.height
              ) - Math.max(position.y, measurement.pageY)
            );
            const overlapArea = xOverlap * yOverlap;
            const areaA = size.width * size.height;

            return { index, overlap: overlapArea / areaA };
          });
          overlapAreas.sort((a, b) => b.overlap - a.overlap);
          const selectedArea = overlapAreas[0];
          if (selectedArea != null && selectedArea.overlap > 0) {
            // console.log(
            //   selectedArea.overlap,
            //   dragDropAreas.value[selectedArea.index]?.id
            // );
            const currMeasurement = measure(movedItemRef);
            const areaHandler =
              dragDropAreas.value[selectedArea.index]?.handler;
            if (currMeasurement != null && areaHandler != null) {
              areaHandler.itemMoved(activeItemId.value, currMeasurement);
            }
          }
        })
        .onEnd(() => {
          runOnJS(clearActiveItem)();
        })
        .onTouchesDown((_, m) => {
          if (activeItemId.value != null) {
            m.activate();
          }
        })
        .onTouchesMove((e, m) => {
          if (activeItemId.value != null && e.state === State.BEGAN) {
            m.activate();
          }
        }),
    [
      activeItemId,
      activeItemPosition,
      activeItemSize,
      dragDropAreas,
      movedItemRef,
      clearActiveItem,
    ]
  );

  //   const gesture = useMemo(
  //     () =>
  //       Gesture.Manual()
  //         .onBegin((e, s) => {
  //           console.log('BEGIN', isDrag.value);
  //         })
  //         .onUpdate((e) => {
  //           console.log(isDrag.value, e.translationX, e.translationY);

  //           if (!isDrag.value) {
  //             return;
  //           }
  //           activeItemPosition.value = {
  //             x: e.translationX,
  //             y: e.translationY,
  //           };
  //         })
  //         .onFinalize(() => {
  //           console.log('END', isDrag.value);
  //         }),
  //     [activeItemPosition, isDrag]
  //   );

  return (
    <DragDropListRootContext.Provider value={value}>
      <GestureDetector gesture={gesture}>
        <Animated.View
          // eslint-disable-next-line react-native/no-inline-styles
          style={{
            flex: 1,
          }}
        >
          {children}
        </Animated.View>
      </GestureDetector>
      {activeItemJSX == null || !layoutExists || (
        <DragDropListMovedItem
          animatedRef={movedItemRef}
          activeItemJSX={activeItemJSX}
          activeItemSize={activeItemSize}
          activeItemPosition={activeItemPosition}
        />
      )}
    </DragDropListRootContext.Provider>
  );
}

export interface DragDropListMovedItemProps {
  animatedRef: AnimatedRef<Animated.View>;
  activeItemJSX: JSX.Element;
  activeItemSize: SharedValue<{
    width: number;
    height: number;
  } | null>;
  activeItemPosition: SharedValue<{
    x: number;
    y: number;
  } | null>;
}

export function DragDropListMovedItem(props: DragDropListMovedItemProps) {
  const { animatedRef, activeItemJSX, activeItemSize, activeItemPosition } =
    props;

  const animStyle = useAnimatedStyle(
    () => ({
      position: 'absolute',
      left: activeItemPosition.value?.x,
      top: activeItemPosition.value?.y,
      width: activeItemSize.value?.width,
      height: activeItemSize.value?.height,
    }),
    []
  );

  return (
    <Animated.View ref={animatedRef} style={animStyle}>
      {activeItemJSX}
    </Animated.View>
  );
}

export interface DragDropListItemType<T> {
  id: string | number;
  data: T;
}

export type DragDropRenderItem<T> = (
  item: DragDropListItemType<T>,
  isActive: SharedValue<boolean>,
  drag: () => void
) => JSX.Element;

export function useDragDrop<T, TComponent extends Component>(
  areaRef: AnimatedRef<TComponent>,
  initialItems: DragDropListItemType<T>[],
  renderItem: DragDropRenderItem<T>
  //   config?: {
  //     groupId?: string;
  //   }
): {
  items: DragDropListItemType<T>[];
  setItems: (items: DragDropListItemType<T>[]) => void;
  renderDragDropItem: (
    item: DragDropListItemType<T>
  ) => JSX.Element | null | undefined;
} {
  const { getDragDropId } = useContext(DragDropListRootContext);

  //   const itemsList = useMemo(
  //     () => DoublyLinkedList.fromArray(initialItems),
  //     [initialItems]
  //   );

  //   const subscribe = useMemo(
  //     () => itemsList.subscribe.bind(itemsList),
  //     [itemsList]
  //   );
  //   const itemsArray = useSyncExternalStore(
  //     subscribe,
  //     itemsList.toArray.bind(itemsList)
  //   );

  const [itemsArray, setItemsArray] = useState(() => [...initialItems]);

  const movingIds = useSharedValue<(string | number)[]>([]);
  const itemIds = useSharedValue(itemsArray.map((item) => item.id));

  const setItems = useCallback((items: DragDropListItemType<T>[]) => {
    setItemsArray(items);
  }, []);

  const itemsHandler = useSharedValue<{
    [key: number | string]: DragDropItemHandler;
  }>({});

  useDerivedValue(() => {
    console.log('COUNT', Object.keys(itemsHandler.value).length);
  }, [itemsHandler]);

  const onHandler = useCallback(
    (id: string | number, handler: DragDropItemHandler) => {
      itemsHandler.value[id] = handler;
      itemsHandler.value = { ...itemsHandler.value };
    },
    [itemsHandler]
  );

  const measureByIndex = useCallback(
    (index: number) => {
      'worklet';
      const id = itemIds.value[index];
      if (id != null) {
        return itemsHandler.value[id]?.measure() ?? null;
      }
      return null;
    },
    [itemIds, itemsHandler]
  );

  const findIndex = useCallback(() => {
    //   itemIds.value.findIndex((idLocal) => idLocal === id);
    return -1;
  }, []);

  const tryPut = useCallback<DragDropAreaHandler<TComponent>['tryPut']>(
    () => false,
    []
  );

  const moveItem = useCallback((from: number, to: number) => {
    setItemsArray((arr) => move(arr, from, to));
  }, []);

  const onTransitionDone = useCallback(
    (id: string | number) => {
      'worklet';
      movingIds.value = movingIds.value.filter((idLocal) => idLocal !== id);
    },
    [movingIds]
  );

  const { startScroll } = useContext(AutoScrollRootContext);

  const itemMoved = useCallback<DragDropAreaHandler<TComponent>['itemMoved']>(
    (id: string | number, rootMeasurement: MeasuredDimensions) => {
      'worklet';
      const index = itemIds.value.findIndex((idLocal) => idLocal === id);
      if (index < 0) {
        return;
      }

      startScroll(rootMeasurement);

      let log = '';
      const addLog = (newLog: string) => (log = log + '\n' + newLog);

      let indexTo = index;
      let indexLocal = index;
      const centerRoot = rootMeasurement.pageY + rootMeasurement.height / 2;
      while (indexLocal >= 0) {
        let prevId = itemIds.value[indexLocal - 1];
        if (
          prevId != null &&
          movingIds.value.every((movingId) => movingId !== prevId)
        ) {
          const prevMeasurement = itemsHandler.value[prevId]?.measure();
          if (prevMeasurement != null) {
            const minY =
              prevMeasurement.pageY +
              (prevMeasurement.height + rootMeasurement.height) / 2;
            addLog(
              `===== MOVE UP\n${index} ${indexLocal} ${centerRoot} ${minY} ${
                centerRoot < minY
              }`
            );
            if (centerRoot < minY) {
              indexTo = indexLocal - 1;
              movingIds.value = [...movingIds.value, prevId];
            } else {
              break;
            }
          }
        }
        indexLocal--;
      }
      if (indexTo !== index) {
        addLog(`INDEX TO AFETER UP ${indexTo}`);
      }

      indexLocal = indexTo;
      while (indexLocal < itemIds.value.length) {
        let nextId = itemIds.value[indexLocal + 1];
        if (
          nextId != null &&
          movingIds.value.every((movingId) => movingId !== nextId)
        ) {
          const nextMeasurement = itemsHandler.value[nextId]?.measure();
          if (nextMeasurement != null) {
            const minY =
              nextMeasurement.pageY +
              (nextMeasurement.height - rootMeasurement.height) / 2;
            addLog(
              `===== MOVE DOWN\n${index} ${indexLocal} ${centerRoot} ${minY} ${
                centerRoot > minY
              }`
            );
            if (centerRoot > minY) {
              indexTo = indexLocal + 1;
              movingIds.value = [...movingIds.value, nextId];
            } else {
              break;
            }
          }
        }
        indexLocal++;
      }
      if (indexTo !== index) {
        addLog(`INDEX TO AFETER DOWN ${indexTo}`);
      }

      indexTo = Math.min(itemIds.value.length - 1, Math.max(0, indexTo));
      if (indexTo !== index) {
        addLog(
          `\n=====\nID: ${id} INDEX: ${index}\nID: ${itemIds.value[indexTo]} INDEX: ${indexTo}\n=====`
        );
        // console.log(log);
        runOnJS(moveItem)(index, indexTo);
        itemIds.value = move(itemIds.value, index, indexTo);
      }
      //   const prevId = itemIds.value[index - 1];
      //   const nextId = itemIds.value[index + 1];
      //   console.log(prevId, nextId, movingIds.value);
      //   if (
      //     prevId != null &&
      //     movingIds.value.every((movingId) => movingId !== prevId)
      //   ) {
      //     const prevMeasurement = itemsHandler.value[prevId]?.measure();
      //     if (prevMeasurement != null) {
      //       const minY = prevMeasurement.pageY + prevMeasurement.height / 2;
      //       if (rootMeasurement.pageY <= minY) {
      //         movingIds.value = [...movingIds.value, prevId];
      //         runOnJS(moveItem)(index, index - 1);
      //       }
      //     }
      //   }
      //   if (
      //     nextId != null &&
      //     movingIds.value.every((movingId) => movingId !== nextId)
      //   ) {
      //     const nextMeasurement = itemsHandler.value[nextId]?.measure();
      //     if (nextMeasurement != null) {
      //       const minY = nextMeasurement.pageY + nextMeasurement.height / 2;
      //       if (rootMeasurement.pageY + rootMeasurement.height > minY) {
      //         movingIds.value = [...movingIds.value, nextId];
      //         runOnJS(moveItem)(index, index + 1);
      //       }
      //     }
      //   }
    },
    [itemIds, itemsHandler, moveItem, movingIds, startScroll]
  );

  const handler = useMemo<DragDropAreaHandler<TComponent>>(
    () => ({ areaRef, measureByIndex, findIndex, tryPut, itemMoved }),
    [areaRef, findIndex, measureByIndex, tryPut, itemMoved]
  );

  const dragDropId = useMemo(
    () => getDragDropId(handler),
    [getDragDropId, handler]
  );

  const renderDragDropItem = useCallback(
    (item: DragDropListItemType<T>) => {
      return (
        <DragDropItem
          key={item.id}
          dragDropAreaId={dragDropId}
          item={item}
          renderItem={renderItem}
          onHandler={onHandler}
          onTransitionDone={onTransitionDone}
        />
      );
    },
    [dragDropId, onHandler, renderItem, onTransitionDone]
  );

  return { items: itemsArray, setItems, renderDragDropItem };
}

interface DragDropItemProps<T> {
  dragDropAreaId: number;
  item: DragDropListItemType<T>;
  renderItem: DragDropRenderItem<T>;
  onHandler: (id: string | number, handler: DragDropItemHandler) => void;
  onTransitionDone: (id: string | number) => void;
}

function DragDropItem<T>(props: DragDropItemProps<T>) {
  const { dragDropAreaId, item, renderItem, onHandler, onTransitionDone } =
    props;

  const { setActiveItem } = useContext(DragDropListRootContext);

  const isActive = useSharedValue(false);
  const isActiveT = useSharedValue(true);

  const animatedRef = useAnimatedRef<Animated.View>();
  const size = useSharedValue<{ width: number; height: number } | null>(null);
  const jsxRef = useRef<ReturnType<DragDropRenderItem<T>>>();

  const measureLocal = useCallback(() => {
    'worklet';
    return measure(animatedRef);
  }, [animatedRef]);

  const handler = useMemo<DragDropItemHandler>(
    () => ({ itemRef: animatedRef, measure: measureLocal }),
    [animatedRef, measureLocal]
  );

  const itemId = item.id;
  useEffect(() => {
    onHandler(itemId, handler);
  }, [handler, itemId, onHandler]);

  const onDrag = useMemo(
    () => (position: { x: number; y: number }) => {
      if (size.value != null && jsxRef.current != null) {
        setActiveItem(
          dragDropAreaId,
          itemId,
          jsxRef.current,
          size.value,
          position
        );
      }
    },
    [dragDropAreaId, itemId, setActiveItem, size]
  );

  const drag = useMemo(
    () =>
      runOnUI(() => {
        'worklet';
        const measurement = measure(animatedRef);
        if (measurement != null) {
          isActive.value = false;
          runOnJS(onDrag)({ x: measurement.pageX, y: measurement.pageY });
        }
      }),
    [animatedRef, isActive, onDrag]
  );

  const jsx = useMemo(() => {
    const jsxItem = renderItem(item, isActive, drag);
    return jsxItem;
  }, [item, isActive, drag, renderItem]);

  useLayoutEffect(() => {
    const jsxItem = renderItem(item, isActiveT, () => {});
    jsxRef.current = jsxItem;
  }, [item, isActiveT, renderItem]);

  return (
    <Animated.View
      key={item.id}
      ref={animatedRef}
      onLayout={({
        nativeEvent: {
          layout: { width, height },
        },
      }) => {
        size.value = { width, height };
      }}
      layout={LinearTransition.withCallback((f) => {
        if (f) {
          onTransitionDone(itemId);
        }
      })}
    >
      {jsx}
    </Animated.View>
  );
}

// class DoublyLinkedListNode<E> {
//   prev: DoublyLinkedListNode<E> | null = null;
//   next: DoublyLinkedListNode<E> | null = null;

//   constructor(public data: E) {}
// }

// class DoublyLinkedList<E> {
//   protected _size = 0;
//   protected _head: DoublyLinkedListNode<E> | null = null;
//   protected _tail: DoublyLinkedListNode<E> | null = null;

//   protected _indexes = new Map<number, DoublyLinkedListNode<E>>();

//   protected _listeners: (() => void)[] = [];

//   constructor() {}

//   *[Symbol.iterator](): IterableIterator<E> {
//     yield* this._getIterator();
//   }

//   subscribe(listener: () => void) {
//     this._listeners = [...this._listeners, listener];
//     return () => {
//       this._listeners = this._listeners.filter((l) => l !== listener);
//     };
//   }

//   protected *_getIterator(): IterableIterator<E> {
//     let current = this._head;

//     while (current) {
//       yield current.data;
//       current = current.next;
//     }
//   }

//   static fromArray<E>(arr: Iterable<E>): DoublyLinkedList<E> {
//     const list = new DoublyLinkedList<E>();
//     for (const node of arr) {
//       list.push(node);
//     }
//     return list;
//   }

//   protected _arrCached: E[] | null = null;

//   toArray(): E[] {
//     if (this._arrCached == null) {
//       const array: E[] = [];
//       let current = this._head;
//       while (current) {
//         array.push(current.data);
//         current = current.next;
//       }
//       this._arrCached = array;
//       return array;
//     }
//     return this._arrCached;
//   }

//   push(el: E) {
//     const newNode = new DoublyLinkedListNode(el);
//     if (!this._head) {
//       this._head = newNode;
//       this._tail = newNode;
//     } else {
//       newNode.prev = this._tail;
//       this._tail!.next = newNode;
//       this._tail = newNode;
//     }
//     this._indexes.set(this._size, newNode);
//     this._size++;
//   }

//   map<T>(
//     callback: (el: E, index: number) => T,
//     thisArg?: any
//   ): DoublyLinkedList<T> {
//     const mappedList = new DoublyLinkedList<T>();
//     let index = 0;
//     for (const current of this) {
//       mappedList.push(callback.call(thisArg, current, index));
//       index++;
//     }

//     return mappedList;
//   }
// }
