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
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import type { DragDropItemType } from './DragDrop';
import * as D3 from './DragDrop';
import { DragDropFlatList } from './DragDropFlatList';
import {
  AutoScrollContextProvider,
  AutoScrollScrollView,
} from './DragDropScroll';
import { DragDropScrollView } from './DragDropScrollView';
import { DragDropView } from './DragDropView';
import { HoveredItemContextProvider } from './HoveredItem';

export default function App() {
  const [t, sT] = useState(true);

  const [type] = useState(2);

  return (
    <GestureHandlerRootView style={styles.container}>
      <AutoScrollContextProvider>
        <HoveredItemContextProvider>
          <D3.DragDropContextProvider>
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
              <View style={styles.footer}>
                <Text>Footer</Text>
              </View>
            </SafeAreaView>
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
      axis={{ horizontal: false }}
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

interface MyItemType {
  text: string;
}

interface MyItemProps {
  item: DragDropItemType<MyItemType>;
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
