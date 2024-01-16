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
  groupId?: string
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

      // handlersMap.modify(
      //   (value: { [key: string | number]: DragDropItemHandler }) => {
      //     'worklet';
      //     value[id] = handler;
      // return value
      //   },
      //   true
      // );

      // return () => {
      //   handlersMap.modify(
      //     (value: { [key: string | number]: DragDropItemHandler }) => {
      //       'worklet';
      //       delete value[id];
      // return value
      //     },
      //     true
      //   );
      // };
      // handlersMap.modify((value) => {
      //   'worklet';
      //   DLRemoveItem(value, id);
      //   DLAddItem(value, id, handler, meta.prevId ?? null);
      //   return value;
      // });

      // return () => {
      //   handlersMap.modify((value) => {
      //     'worklet';
      //     DLRemoveItem(value, id);
      //     return value;
      //   });
      // };
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

        return [
          handlers.value
            .map((h) => h?.id)
            .filter((id): id is string | number => id != null),
          index,
          indexTo,
        ];
      }
      return null;

      //!
      // // const index = DLFindIndex(handlersMap.value, item.id);
      // // console.log('ITEM MOVED1');
      // const listItem = handlersMap.value.nodes[item.id] ?? null;

      // // let log = '';
      // // const addLog = (newLog: string) => (log = log + '\n' + newLog);

      // // let indexTo = index;
      // // let indexLocal = index;
      // let listItemLocal = listItem;
      // let listItemTo = listItem;
      // const centerRoot = hoverMeasurement.pageY + hoverMeasurement.height / 2;
      // let i = 0;
      // while (listItemLocal != null && i < 100) {
      //   const prevId = listItemLocal.prevId;
      //   if (
      //     prevId != null &&
      //     movingIds.value.every((movingId) => movingId !== prevId)
      //   ) {
      //     const prevMeasurement =
      //       handlersMap.value.nodes[prevId]?.data.measure();
      //     if (prevMeasurement != null) {
      //       const minY =
      //         prevMeasurement.pageY +
      //         (prevMeasurement.height + hoverMeasurement.height) / 2;
      //       // addLog(
      //       //   `===== MOVE UP\n${index} ${indexLocal} ${
      //       //     handlersMap.value.nodes[prevId]?.id
      //       //   } ${prevId}\n${centerRoot} ${minY} ${centerRoot < minY}`
      //       // );
      //       if (centerRoot < minY) {
      //         // indexTo = indexLocal - 1;
      //         listItemTo = handlersMap.value.nodes[prevId] ?? null;
      //         // movingIds.modify((value: (string | number)[]) => {
      //         //   'worklet';
      //         //   value.push(prevId!);
      //         //   return value;
      //         // }, true);
      //       } else {
      //         break;
      //       }
      //     }
      //   }
      //   listItemLocal =
      //     prevId == null ? null : handlersMap.value.nodes[prevId] ?? null;
      //   // indexLocal--;
      //   i++;
      // }
      // // if (indexTo !== index) {
      // //   addLog(`INDEX TO AFETER UP ${indexTo}`);
      // // }

      // // indexLocal = indexTo;
      // listItemLocal = listItemTo;
      // // while (listItemLocal != null && i < 100) {
      // //   const nextId = listItemLocal.nextId;
      // //   if (
      // //     nextId != null &&
      // //     movingIds.value.every((movingId) => movingId !== nextId)
      // //   ) {
      // //     const nextMeasurement =
      // //       handlersMap.value.nodes[nextId]?.data.measure();
      // //     if (nextMeasurement != null) {
      // //       const minY =
      // //         nextMeasurement.pageY +
      // //         (nextMeasurement.height - hoverMeasurement.height) / 2;
      // //       // addLog(
      // //       //   `===== MOVE DOWN\n${index} ${indexLocal} ${centerRoot} ${minY} ${
      // //       //     centerRoot > minY
      // //       //   }`
      // //       // );
      // //       if (centerRoot > minY) {
      // //         listItemTo = handlersMap.value.nodes[nextId] ?? null;
      // //         // indexTo = indexLocal + 1;
      // //         // movingIds.modify((value: (string | number)[]) => {
      // //         //   'worklet';
      // //         //   value.push(nextId!);
      // //         //   return value;
      // //         // }, true);
      // //       } else {
      // //         break;
      // //       }
      // //     }
      // //   }
      // //   listItemLocal =
      // //     nextId == null ? null : handlersMap.value.nodes[nextId] ?? null;
      // //   // indexLocal++;
      // //   i++;
      // // }
      // // if (indexTo !== index) {
      // //   addLog(`INDEX TO AFETER DOWN ${indexTo}`);
      // // }

      // // indexTo = Math.min(itemIds.value.length - 1, Math.max(0, indexTo));
      // if (
      //   // indexTo !== index &&
      //   listItem != null &&
      //   listItemTo != null &&
      //   listItem !== listItemTo
      // ) {
      //   // addLog(
      //   //   `\n=====\nID: ${item.id} INDEX: ${index}\nID: ${listItem?.id} INDEX: ${indexTo}\n=====`
      //   // );
      //   handlersMap.modify((value) => {
      //     'worklet';
      //     if (
      //       listItem != null &&
      //       listItemTo != null &&
      //       listItem !== listItemTo
      //     ) {
      //       DLSwapItems(value, listItem, listItemTo);
      //     }
      //     return value;
      //   }, true);
      //   // console.log('IDS', DLGetIds(handlersMap.value));
      //   // console.log(log);
      //   // return [index, indexTo]
      //   // runOnJS(moveItem)(index, indexTo);
      //   // itemIds.value = move(itemIds.value, index, indexTo);
      // }

      // if (DLFindLoop(handlersMap.value)) {
      //   console.log('LOOOP');
      // }

      // const ids = DLGetIds(handlersMap.value);
      // // console.log('ITEM MOVED2');
      // return [ids, listItem?.id ?? 0, listItemTo?.id ?? 0];
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
    { groupId }
  );

  return useMemo(() => ({ ...v, onTransitionDone }), [v, onTransitionDone]);
}
