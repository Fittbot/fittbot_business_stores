import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import ClientItem from './ClientItem';

const ClientList = ({ clients }) => {
  return (
    <FlatList
      data={[
        ...clients,
      ]}
      keyExtractor={(item, index) => {
        return index;
      }}
      renderItem={({ item }) => <ClientItem client={item} />}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled
      initialNumToRender={10}
      // onEndReached={loadMoreClients}
    />
  );
};

const styles = StyleSheet.create({
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    marginTop: 10,
    // height: 500,
  },
});

export default ClientList;
