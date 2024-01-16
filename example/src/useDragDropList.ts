import { useCallback, useMemo, type Component } from 'react';
import {
  runOnJS,
  useSharedValue,
  type AnimatedRef,
  type SharedValue,
} from 'react-native-reanimated';
import { move } from 'react-native-redash';
import {
  useDragDropArea,
  type DragDropAreaHandler,
  type DragDropItemHandler,
  type DragDropItemProps,
  type DragDropRenderItem,
  type useDragDropAreaHandlers,
} from './DragDrop';

export function useDragDropList<T, TComponent extends Component>(
  areaRef: AnimatedRef<TComponent>,
  initialItems: T[],
  onChange: (items: T[], from: number, to: number) => void,
  renderItem: DragDropRenderItem<T>,
  extractId: (item: T) => number | string,
  config?: {
    groupId?: string;
    axis?: {
      horizontal?: boolean;
      vertical?: boolean;
    };
  }
) {
  const itemIds = useSharedValue<(number | string)[]>(
    initialItems.map((item) => extractId(item))
  );
  const handlers = useSharedValue<(null | DragDropItemHandler<T>)[]>([]);
  const handlersMap = useSharedValue<{
    [key: string | number]: DragDropItemHandler<T>;
  }>({});
  // const handlersPos = useSharedValue<{ [key: number]: string | number }>({});

  const registerItemHandler = useCallback<
    DragDropItemProps<T, SharedValue<number>>['registerItemHandler']
  >(
    (id, handler, index) => {
      handlers.modify((value: (null | DragDropItemHandler<T>)[]) => {
        'worklet';
        while (value.length <= index.value) {
          value.push(null);
        }
        value[index.value] = handler;
        return value;
      }, true);

      handlersMap.modify(
        (value: { [key: string | number]: DragDropItemHandler<T> }) => {
          'worklet';
          value[id] = handler;
          return value;
        },
        true
      );

      return () => {
        handlers.modify((value: (null | DragDropItemHandler<T>)[]) => {
          'worklet';
          value[index.value] = null;
          return value;
        }, true);

        handlersMap.modify(
          (value: { [key: string | number]: DragDropItemHandler<T> }) => {
            'worklet';
            delete value[id];
            return value;
          },
          true
        );
      };
    },
    [handlers, handlersMap]
  );

  const measureItem = useCallback(
    (id: number | string) => {
      'worklet';
      const handler = handlersMap.value[id];
      return handler?.measure() ?? null;
    },
    [handlersMap]
  );

  const movingIds = useSharedValue<{ [key: string | number]: null }>({});
  const itemMoved = useCallback<DragDropAreaHandler<T>['itemMoved']>(
    (item, hoverMeasurement) => {
      'worklet';

      const index = handlers.value.findIndex(
        (itemLocal) => itemLocal?.id === item.id
      );
      if (index < 0) {
        return null;
      }

      let log = '';
      const addLog = (newLog: string) => (log = log + '\n' + newLog);

      let indexTo = index;
      let indexLocal = index;
      const centerRoot = hoverMeasurement.pageY + hoverMeasurement.height / 2;
      while (indexLocal >= 0) {
        let prevHandler = handlers.value[indexLocal - 1];
        if (prevHandler != null && movingIds.value[prevHandler.id] !== null) {
          const prevMeasurement = prevHandler.measure();
          if (prevMeasurement != null) {
            const minY =
              prevMeasurement.pageY +
              (prevMeasurement.height + hoverMeasurement.height) / 2;
            addLog(
              `===== MOVE UP\n${index} ${indexLocal} ${centerRoot} ${minY} ${
                centerRoot < minY
              }`
            );
            if (centerRoot < minY) {
              indexTo = indexLocal - 1;
              const prevId = prevHandler.id;
              movingIds.modify((value: { [key: string | number]: null }) => {
                'worklet';
                value[prevId] = null;
                return value;
              });
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
      while (indexLocal < handlers.value.length) {
        let nextHandler = handlers.value[indexLocal + 1];
        if (nextHandler != null && movingIds.value[nextHandler.id] !== null) {
          const nextMeasurement = nextHandler.measure();
          if (nextMeasurement != null) {
            const minY =
              nextMeasurement.pageY +
              (nextMeasurement.height - hoverMeasurement.height) / 2;
            addLog(
              `===== MOVE DOWN\n${index} ${indexLocal} ${centerRoot} ${minY} ${
                centerRoot > minY
              }`
            );
            if (centerRoot > minY) {
              indexTo = indexLocal + 1;
              const nextId = nextHandler.id;
              movingIds.modify((value: { [key: string | number]: null }) => {
                'worklet';
                value[nextId] = null;
                return value;
              });
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

      indexTo = Math.min(handlers.value.length - 1, Math.max(0, indexTo));
      if (indexTo !== index) {
        addLog(
          `\n=====\nID: ${item.id} INDEX: ${index}\nID: ${handlers.value[indexTo]?.id} INDEX: ${indexTo}\n=====`
        );
        // console.log(log);
        // itemIds.value = move(itemIds.value, index, indexTo);
        handlers.modify((value: (DragDropItemHandler<T> | null)[]) => {
          'worklet';

          return move(value, index, indexTo);
        }, true);
        itemIds.modify((value: (number | string)[]) => {
          'worklet';

          return move(value, index, indexTo);
        }, true);
        itemIds;
        runOnJS(onChange)([], index, indexTo);

        return [index, indexTo];
      }
      return null;
    },
    [handlers, movingIds, itemIds, onChange]
  );

  const onTransitionDone = useCallback(
    (id: string | number) => {
      'worklet';
      movingIds.modify(
        (value: { [key: string]: null; [key: number]: null }) => {
          'worklet';
          delete value[id];
          return value;
        }
      );
    },
    [movingIds]
  );

  const tryPutItem = useCallback<
    useDragDropAreaHandlers<T, SharedValue<number>>['tryPutItem']
  >(
    (_, hoverMeasurement) => {
      'worklet';

      let result: [index: number] | null = null;

      if (handlers.value.length < 1) {
        result = [0];
      }

      let nearItemIndex: number | null = null;
      let index = 0;
      for (const handler of handlers.value) {
        if (handler != null) {
          const existsItemMeasurement = handler.measure();
          if (existsItemMeasurement != null) {
            if (existsItemMeasurement.pageY < hoverMeasurement.pageY) {
              nearItemIndex = index;
            }
          }
        }
        index++;
      }
      if (nearItemIndex != null) {
        const newItemAt = nearItemIndex + 1;
        handlers.modify((value: (DragDropItemHandler<T> | null)[]) => {
          'worklet';
          value.splice(newItemAt, 0, null);
          return value;
        }, true);
        result = [newItemAt];
      }
      return result;
    },
    [handlers]
  );

  const removeItem = useCallback<
    useDragDropAreaHandlers<T, SharedValue<number>>['removeItem']
  >(
    (itemId) => {
      'worklet';

      movingIds.modify(
        (value: { [key: string]: null; [key: number]: null }) => {
          'worklet';
          delete value[itemId];
          return value;
        }
      );
      const index = itemIds.value.findIndex((id) => id === itemId);
      if (index >= 0) {
        handlers.modify((value: (DragDropItemHandler<T> | null)[]) => {
          'worklet';
          value.splice(index, 1);
          return value;
        }, true);
        itemIds.modify((value: (number | string)[]) => {
          'worklet';
          value.splice(index, 0);
          return value;
        }, true);
      }
    },
    [handlers, itemIds, movingIds]
  );

  const handlerCallbacks = useMemo<
    useDragDropAreaHandlers<T, SharedValue<number>>
  >(
    () => ({
      measureItem,
      registerItemHandler,
      itemMoved,
      onTransitionDone,
      tryPutItem,
      removeItem,
    }),
    [
      measureItem,
      registerItemHandler,
      itemMoved,
      onTransitionDone,
      tryPutItem,
      removeItem,
    ]
  );

  const v = useDragDropArea(
    areaRef,
    initialItems,
    renderItem,
    extractId,
    handlerCallbacks,
    config
  );

  return useMemo(() => ({ ...v, onTransitionDone }), [v, onTransitionDone]);
}
