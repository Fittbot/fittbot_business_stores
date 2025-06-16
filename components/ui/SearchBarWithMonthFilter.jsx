import React, { useRef, forwardRef, useImperativeHandle, useMemo } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

const SearchBarWithFilterButton = forwardRef(
  (
    {
      placeholder = 'Search by name or contact',
      style,
      inputStyle,
      value,
      onChangeText,
      onFilterPress,
      selectedMonth,
      onClearText,
      selectedYear,
    },
    ref
  ) => {
    const inputRef = useRef(null);
  
  // Memoize the input element to prevent re-creation on every render
  const inputElement = useMemo(() => (
    <TextInput
      ref={inputRef}
      style={[styles.input, inputStyle]}
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      autoCorrect={false}
      autoCapitalize="none"
      blurOnSubmit={false}
      underlineColorAndroid="transparent"
      returnKeyType="search"
    />
  ), [value, inputStyle, placeholder, onChangeText]);

    // Expose the inputRef to parent components
    useImperativeHandle(ref, () => ({
      focus: () => {
        inputRef.current?.focus();
      },
      blur: () => {
        inputRef.current?.blur();
      },
      isFocused: () => {
        return inputRef.current?.isFocused() || false;
      },
    }));

    const handleClearText = () => {
      if (onClearText) {
        onClearText();
      }
      if (onChangeText) {
        onChangeText('');
      }
      // Focus input after clearing text
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    };

    return (
      <View style={[styles.container, style]}>
        <View style={styles.searchContainer}>
          <View style={styles.inputContainer}>
            <Icon
              name="search"
              size={18}
              color="#888"
              style={styles.searchIcon}
            />
            {inputElement}
            {value && value.length > 0 && (
              <TouchableOpacity
                style={styles.clearTextButton}
                onPress={handleClearText}
                hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
              >
                <Icon name="x" size={16} color="#888" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.filterButtonContainer}>
            {selectedMonth ? (
              <TouchableOpacity
                style={styles.filterButton}
                onPress={onFilterPress}
              >
                <Text style={styles.selectedFilterText} numberOfLines={1}>
                  {selectedMonth.slice(0, 3)}
                </Text>
                <Text style={styles.selectedFilterText2} numberOfLines={1}>
                  {selectedYear}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.filterButton}
                onPress={onFilterPress}
              >
                <Icon name="calendar" size={18} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    paddingHorizontal: 3,
  },
  searchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 54,
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    flex: 1,
    marginRight: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    color: '#333',
    padding: 0,
  },
  clearTextButton: {
    padding: 5,
  },
  filterButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
  },
  filterButton: {
    width: 45,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#10A0F6',
    borderRadius: 8,
  },
  selectedFilterDisplay: {
    backgroundColor: '#10A0F6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginRight: 5,
    height: '100%',
    justifyContent: 'center',
  },
  selectedFilterText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  selectedFilterText2: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '500',
  },
});

export default SearchBarWithFilterButton;
