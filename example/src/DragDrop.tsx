import React, {
  Component,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  LinearTransition,
  measure,
  runOnJS,
  runOnUI,
  useAnimatedRef,
  useFrameCallback,
  useSharedValue,
  type AnimatedRef,
  type MeasuredDimensions,
  type SharedValue,
} from 'react-native-reanimated';
import { move } from 'react-native-redash';
import { AutoScrollRootContext } from './DragDropScroll';
import { HoveredItemContext } from './HoveredItem';

//! TYPES

export interface DragDropItemType<T> {
  id: string | number;
  data: T;
}

export interface DragDropAreaHandler<T> {
  groupId?: string;
  measure: () => MeasuredDimensions | null;
  measureItem: (itemId: number | string) => MeasuredDimensions | null;
  itemMoved: (
    item: DragDropItemType<T>,
    hoverMeasurement: MeasuredDimensions
  ) => [ids: (number | string)[], from: number, to: number] | null;
  tryPutItem: (
    item: DragDropItemType<T>,
    hoverMeasurement: MeasuredDimensions
  ) => [index: number] | null;
  removeItem: (itemId: number | string) => void;
}

export interface DragDropItemHandler<T> {
  id: string | number;
  data: T;
  measure: () => MeasuredDimensions | null;
}

//! CONTEXT

export interface DragDropContextType {
  startDrag: (
    area: {
      id: number;
      groupId?: string;
    },
    item: DragDropItemType<unknown>,
    itemJSX: JSX.Element
  ) => void;
  registerDragDropArea: (handler: DragDropAreaHandler<unknown>) => number;
  unregisterDragDropArea: (id: number) => void;
}

export const DragDropContext = React.createContext<DragDropContextType>({
  startDrag: () => {},
  registerDragDropArea: () => -1,
  unregisterDragDropArea: () => {},
});

export interface DragDropContextProviderProps {
  children: React.ReactNode;
}

export function DragDropContextProvider(props: DragDropContextProviderProps) {
  const { children } = props;

  const {
    setHoveredItem,
    clearHoveredItem,
    moveHoveredItem,
    measureHoveredItem,
  } = useContext(HoveredItemContext);
  const { startScroll, stopScroll } = useContext(AutoScrollRootContext);

  const dragDropItemMeta = useSharedValue<
    | [
        Parameters<DragDropContextType['startDrag']>[0],
        Parameters<DragDropContextType['startDrag']>[1],
        position: { x: number; y: number },
        size: { width: number; height: number }
      ]
    | null
  >(null);

  const dragDropAreas = useSharedValue<{
    [key: string | number]: DragDropAreaHandler<unknown>;
  }>({});

  const dragDropId = useRef(-1);

  //! CONTEXT VALUE

  const registerDragDropArea = useCallback<
    DragDropContextType['registerDragDropArea']
  >(
    (handler: DragDropAreaHandler<unknown>) => {
      const id = ++dragDropId.current;
      dragDropAreas.modify(
        (value: { [key: string | number]: DragDropAreaHandler<unknown> }) => {
          'worklet';
          value[id] = handler;
          return value;
        }
      );
      return id;
    },
    [dragDropId, dragDropAreas]
  );

  const unregisterDragDropArea = useCallback<
    DragDropContextType['unregisterDragDropArea']
  >(
    (id) => {
      dragDropAreas.modify(
        (value: { [key: string | number]: DragDropAreaHandler<unknown> }) => {
          'worklet';
          delete value[id];
          return value;
        }
      );
    },
    [dragDropAreas]
  );

  // const itemPosition = useSharedValue<{ x: number; y: number } | null>(null);
  const startDragMeta = useRef<Parameters<DragDropContextType['startDrag']>>();
  const onStartDrag = useCallback(
    (itemMeasurement: MeasuredDimensions) => {
      if (startDragMeta.current == null) {
        return;
      }
      const [area, item, itemJSX] = startDragMeta.current;

      const position = { x: itemMeasurement.pageX, y: itemMeasurement.pageY };
      const size = {
        width: itemMeasurement.width,
        height: itemMeasurement.height,
      };

      setHoveredItem(itemJSX, position, size);
      dragDropItemMeta.value = [area, item, position, size];
    },
    [dragDropItemMeta, setHoveredItem]
  );

  const startDrag = useCallback<DragDropContextType['startDrag']>(
    (area, item, itemJSX) => {
      startDragMeta.current = [area, item, itemJSX];
      const itemId = item.id;
      runOnUI(() => {
        'worklet';
        const areaHandler = dragDropAreas.value[area.id];
        const itemMeasurement = areaHandler?.measureItem(itemId);
        if (itemMeasurement == null) {
          return;
        }
        runOnJS(onStartDrag)(itemMeasurement);
      })();
    },
    [dragDropAreas, onStartDrag]
  );

  const value = useMemo<DragDropContextType>(
    () => ({ registerDragDropArea, unregisterDragDropArea, startDrag }),
    [registerDragDropArea, unregisterDragDropArea, startDrag]
  );

  //! GESTURE

  const hoveredItemMeasurement = useSharedValue<MeasuredDimensions | null>(
    null
  );
  const moveAnim = useFrameCallback(() => {
    'worklet';

    if (
      dragDropItemMeta.value == null ||
      hoveredItemMeasurement.value == null
    ) {
      return;
    }

    startScroll(hoveredItemMeasurement.value);
    for (const areaId of Object.keys(dragDropAreas.value)) {
      const areaHandler = dragDropAreas.value[areaId]!;
      const areaMeasurement = areaHandler.measure();

      if (
        areaMeasurement != null &&
        ((dragDropItemMeta.value[0].groupId == null &&
          dragDropItemMeta.value[0].id.toString() === areaId) ||
          (dragDropItemMeta.value[0].groupId != null &&
            dragDropItemMeta.value[0].groupId === areaHandler.groupId)) &&
        hoveredItemMeasurement.value.pageX <
          areaMeasurement.pageX + areaMeasurement.width &&
        hoveredItemMeasurement.value.pageX +
          hoveredItemMeasurement.value.width >
          areaMeasurement.pageX &&
        hoveredItemMeasurement.value.pageY <
          areaMeasurement.pageY + areaMeasurement.height &&
        hoveredItemMeasurement.value.pageY +
          hoveredItemMeasurement.value.height >
          areaMeasurement.pageY
      ) {
        if (areaId !== dragDropItemMeta.value[0].id.toString()) {
          const putResult =
            areaHandler.tryPutItem(
              dragDropItemMeta.value[1],
              hoveredItemMeasurement.value
            ) != null;
          console.log(
            'PUT START',
            dragDropItemMeta.value[0].id,
            areaId,
            putResult != null
          );
          if (putResult != null) {
            dragDropAreas.value[dragDropItemMeta.value[0].id]?.removeItem(
              dragDropItemMeta.value[1].id
            );
            dragDropItemMeta.modify((valueLocal) => {
              valueLocal[0].id = parseInt(areaId, 10);
              return valueLocal;
            }, true);
          }
          console.log('PUT END', dragDropItemMeta.value[0].id);
        }

        areaHandler.itemMoved(
          dragDropItemMeta.value[1],
          hoveredItemMeasurement.value
        );
        break;
      }
    }
  }, false);

  const setMoveAnimActive = useCallback(
    (isActive: boolean) => {
      moveAnim.setActive(isActive);
    },
    [moveAnim]
  );

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .manualActivation(true)
        .onStart(() => {
          runOnJS(setMoveAnimActive)(true);
        })
        .onChange((e) => {
          if (dragDropItemMeta.value == null) {
            return;
          }
          const position = dragDropItemMeta.value[2];
          const newPosition = {
            x: position.x + e.changeX,
            y: position.y + e.changeY,
          };
          dragDropItemMeta.value = [
            dragDropItemMeta.value[0],
            dragDropItemMeta.value[1],
            newPosition,
            dragDropItemMeta.value[3],
          ];

          moveHoveredItem(newPosition);

          hoveredItemMeasurement.value = measureHoveredItem();
        })
        .onFinalize(() => {
          if (dragDropItemMeta.value != null) {
            runOnJS(setMoveAnimActive)(false);
            dragDropItemMeta.value = null;
            stopScroll();
            runOnJS(clearHoveredItem)();
          }
        })
        .onTouchesDown((e, manager) => {
          if (dragDropItemMeta.value != null && e.state === 2) {
            manager.activate();
          }
        })
        .onTouchesMove((e, manager) => {
          if (dragDropItemMeta.value != null && e.state === 2) {
            manager.activate();
          }
        }),
    [
      setMoveAnimActive,
      dragDropItemMeta,
      moveHoveredItem,
      hoveredItemMeasurement,
      measureHoveredItem,
      stopScroll,
      clearHoveredItem,
    ]
  );

  return (
    <DragDropContext.Provider value={value}>
      <GestureDetector gesture={gesture}>
        <Animated.View
          // eslint-disable-next-line react-native/no-inline-styles
          style={{ flex: 1 }}
        >
          {children}
        </Animated.View>
      </GestureDetector>
    </DragDropContext.Provider>
  );
}

//! HOOK

export type DragDropRenderItem<T> = (
  item: DragDropItemType<T>,
  isActive: SharedValue<boolean>,
  drag: () => void
) => JSX.Element;

export interface useDragDropAreaReturn<T, M = undefined> {
  areaId: number;
  items: DragDropItemType<T>[];
  setItems: (items: DragDropItemType<T>[]) => void;
  renderDragDropItem: (
    item: DragDropItemType<T>,
    meta: M
  ) => JSX.Element | null | undefined;
}

export type RegisterItemHandler<T, M> = (
  id: number | string,
  handler: DragDropItemHandler<T>,
  meta: M
) => () => void;

export type useDragDropAreaHandlers<T, M> = {
  registerItemHandler: RegisterItemHandler<T, M>;
  measureItem: DragDropAreaHandler<T>['measureItem'];
  itemMoved: DragDropAreaHandler<T>['itemMoved'];
  onTransitionDone: (id: string | number) => void;
  tryPutItem: DragDropAreaHandler<T>['tryPutItem'];
  removeItem: DragDropAreaHandler<T>['removeItem'];
};

export function useDragDropArea<T, TComponent extends Component, M = undefined>(
  areaRef: AnimatedRef<TComponent>,
  initialItems: T[],
  renderItem: DragDropRenderItem<T>,
  extractId: (item: T) => number | string,
  handlerCallbacks: useDragDropAreaHandlers<T, M>,
  config?: {
    groupId?: string;
  }
): useDragDropAreaReturn<T, M> {
  const { registerDragDropArea, unregisterDragDropArea } =
    useContext(DragDropContext);

  const [items, setItems] = useState<DragDropItemType<T>[]>(() =>
    initialItems.map((item) => ({ id: extractId(item), data: item }))
  );

  // const itemsMap = useMemo(
  //   () =>
  //     items.reduce<{ [key: number | string]: DragDropItemType<T> }>(
  //       (map, item) => {
  //         map[item.id] = item;
  //         return map;
  //       },
  //       {}
  //     ),
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  //   [initialItems]
  // );

  //   const itemIds = useDerivedValue(() => items.map((item) => item.id), [items]);

  const measureArea = useCallback(() => {
    'worklet';
    return measure(areaRef);
  }, [areaRef]);

  const moveItem = useCallback((from: number, to: number) => {
    setItems((itemsLocal) => move(itemsLocal, from, to));
  }, []);

  const putItem = useCallback<
    (item: DragDropItemType<T>, index: number) => void
  >((item, index) => {
    setItems((itemsLocal) => {
      itemsLocal.splice(index, 0, item);
      console.log('PUT', itemsLocal);
      return [...itemsLocal];
    });
  }, []);
  const removeItemLocal = useCallback<DragDropAreaHandler<T>['removeItem']>(
    (itemId) => {
      setItems((itemsLocal) => itemsLocal.filter((item) => item.id !== itemId));
    },
    []
  );
  // const moveItem2 = useCallback(
  //   (ids: (string | number)[]) => {
  //     const newItems: DragDropItemType<T>[] = [];
  //     for (const id of ids) {
  //       const item = itemsMap[id];
  //       if (item != null) {
  //         newItems.push(item);
  //       }
  //     }
  //     console.log(ids);
  //     setItems(newItems);
  //   },
  //   [itemsMap]
  // );

  const itemMovedCb = handlerCallbacks.itemMoved;
  const itemMoved = useCallback<DragDropAreaHandler<T>['itemMoved']>(
    (item, hoverMeasurement) => {
      'worklet';
      const movedResult = itemMovedCb(item, hoverMeasurement);
      if (movedResult != null) {
        runOnJS(moveItem)(movedResult[1], movedResult[2]);
        // runOnJS(moveItem2)(movedResult[0]);
      }
      return movedResult;
    },
    [itemMovedCb, moveItem]
  );

  const tryPutItemCb = handlerCallbacks.tryPutItem;
  const tryPutItem = useCallback<DragDropAreaHandler<T>['tryPutItem']>(
    (item, hoverMeasurement) => {
      'worklet';
      const movedResult = tryPutItemCb(item, hoverMeasurement);
      if (movedResult != null) {
        runOnJS(putItem)(item, movedResult[0]);
        // runOnJS(moveItem2)(movedResult[0]);
      }
      return movedResult;
    },
    [putItem, tryPutItemCb]
  );

  const removeItemCb = handlerCallbacks.removeItem;
  const removeItem = useCallback<DragDropAreaHandler<T>['removeItem']>(
    (itemId) => {
      'worklet';
      removeItemCb(itemId);
      runOnJS(removeItemLocal)(itemId);
    },
    [removeItemCb, removeItemLocal]
  );

  const handler = useMemo<DragDropAreaHandler<T>>(
    () => ({
      groupId: config?.groupId,
      measure: measureArea,
      measureItem: handlerCallbacks.measureItem,
      itemMoved,
      tryPutItem,
      removeItem,
    }),
    [
      config?.groupId,
      measureArea,
      handlerCallbacks.measureItem,
      itemMoved,
      tryPutItem,
      removeItem,
    ]
  );

  const prevAreaId = useRef<number>();
  const areaId = useMemo(() => {
    if (prevAreaId.current != null) {
      unregisterDragDropArea(prevAreaId.current);
    }
    const id = registerDragDropArea(handler as DragDropAreaHandler<unknown>);
    prevAreaId.current = id;
    return id;
  }, [handler, registerDragDropArea, unregisterDragDropArea]);
  useEffect(() => {
    return () => {
      if (prevAreaId.current != null) {
        unregisterDragDropArea(prevAreaId.current);
      }
    };
  }, [prevAreaId, unregisterDragDropArea]);

  const renderDragDropItem = useCallback<
    useDragDropAreaReturn<T, M>['renderDragDropItem']
  >(
    (item, meta) => (
      <DragDropItem
        key={item.id}
        areaId={areaId}
        groupId={config?.groupId}
        item={item}
        meta={meta}
        renderItem={renderItem}
        registerItemHandler={handlerCallbacks.registerItemHandler}
        onTransitionDone={handlerCallbacks.onTransitionDone}
      />
    ),
    [areaId, config?.groupId, handlerCallbacks, renderItem]
  );

  return { areaId, items, setItems, renderDragDropItem };
}

//! DRAG DROP ITEM

export interface DragDropItemProps<T, M = undefined> {
  areaId: number;
  groupId?: string;
  item: DragDropItemType<T>;
  meta: M;
  renderItem: DragDropRenderItem<T>;
  registerItemHandler: RegisterItemHandler<T, M>;
  onTransitionDone: (id: string | number) => void;
}

export function DragDropItem<T, M = undefined>(props: DragDropItemProps<T, M>) {
  const {
    areaId,
    groupId,
    item,
    meta,
    renderItem,
    registerItemHandler,
    onTransitionDone,
  } = props;

  const { startDrag } = useContext(DragDropContext);

  const animatedRef = useAnimatedRef<Animated.View>();
  const jsxRef = useRef<JSX.Element>();
  const isActive = useSharedValue(false);
  const isActiveT = useSharedValue(true);

  const itemId = item.id;
  const drag = useCallback(() => {
    if (jsxRef.current != null) {
      startDrag(
        { id: areaId, groupId },
        item,
        renderItem(item, isActiveT, drag)
      );
    }
  }, [areaId, groupId, isActiveT, item, renderItem, startDrag]);

  const jsx = useMemo(() => {
    const jsxLocal = renderItem(item, isActive, drag);
    jsxRef.current = jsxLocal;
    return jsxLocal;
  }, [isActive, item, drag, renderItem]);

  //! ITEM HANDLER

  const measureItem = useCallback(() => {
    'worklet';
    return measure(animatedRef);
  }, [animatedRef]);

  const handler = useMemo<DragDropItemHandler<T>>(
    () => ({ id: item.id, data: item.data, measure: measureItem }),
    [item, measureItem]
  );

  useEffect(() => {
    return registerItemHandler(itemId, handler, meta);
  }, [handler, itemId, meta, registerItemHandler]);

  return (
    <Animated.View
      ref={animatedRef}
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
