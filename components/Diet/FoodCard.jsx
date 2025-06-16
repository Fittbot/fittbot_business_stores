// components/FoodCard.js
import { Image } from 'expo-image';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import StepperButton from './StepperButton';
import RightArrowIcon from '../../components/ui/right_arrow';

const FoodCard = ({
  id,
  image,
  title,
  calories,
  carbs,
  fat,
  protein,
  quantity,
  time,
  timeAdded,
  onAdd,
  updateFoodQuantity,
  showAddFoodButton,
  viewAllFood=false
}) => {
  const [addFood, setAddFood] = React.useState(false);
  const [foodCount, setFoodCount] = React.useState(1);

  const nutrients = [
    {
      label: 'Calories',
      value: calories,
      width: 13,
      icon: require('../../assets/images/diet/calorie.png'),
    },
    {
      label: 'Proteins',
      value: protein,
      width: 22,
      icon: require('../../assets/images/diet/protein.png'),
    },
    {
      label: 'Carbs',
      value: carbs,
      width: 22,
      icon: require('../../assets/images/diet/carb.png'),
    },
    {
      label: 'Fats',
      value: fat,
      width: 17,
      icon: require('../../assets/images/diet/fat.png'),
    },
  ];

  const handleFoodCount = (count) => {
    setFoodCount(count);
    updateFoodQuantity(id, count);
  };

  if (!id) {
    return null;
  }

  return (
    <TouchableOpacity
      onPress={() => {
        if (!time && !viewAllFood) {
          setAddFood(!addFood);
          onAdd();
        }
      }}
      style={{ backgroundColor: '#fff' }}
      activeOpacity={0.8}
    >
      <View style={styles.card}>
        <View style={styles.sub_section}>
          {/* <Image source={image} style={styles.image} /> */}
          <Image
            source={require('../../assets/images/food/paneer_salad.png')}
            style={styles.image}
          />

          <View style={styles.container}>
            <View style={styles.details}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.bowlText}>
                {/* {foodCount}  */}
                {quantity}
              </Text>
              <TouchableOpacity
                // onPress={onAdd}
                onPress={() => {
                  if (!time) {
                    setAddFood(!addFood);
                    onAdd();
                  }
                }}
              >
                {time && <Text style={styles.addText}>{time}</Text>}
                {/* {timeAdded && <Text style={styles.addText}>{timeAdded}</Text>} */}

                {!showAddFoodButton && (
                  <>
                    {!time && !viewAllFood? (
                      <>
                        {!addFood ? (
                          <Text style={styles.addText}>+Add</Text>
                        ) : (
                          <Text style={styles.addText2}>
                            Remove
                            {/* <RightArrowIcon /> */}
                          </Text>
                        )}
                      </>
                    ):('')}
                  </>
                )}
              </TouchableOpacity>
            </View>

            {!addFood && (
              <View style={[styles.nutrition]}>
                {nutrients.map((item, index) => (
                  <View style={styles.row} key={index}>
                    <Image
                      source={item.icon}
                      style={[styles.icon, { width: item.width }]}
                    />
                    <Text style={styles.label}>{item.label}</Text>
                    <Text style={styles.value}>{item.value}</Text>
                  </View>
                ))}
              </View>
            )}

            {addFood && (
              <View
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 7,
                }}
              >
                <StepperButton
                  foodCount={foodCount}
                  onChange={handleFoodCount}
                />
              </View>
            )}
          </View>
        </View>

        {addFood && (
          <View style={styles.nutri}>
            <LinearGradient
              colors={['#28a7461e', '#007bff1d']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nutrition_2}
            >
              {nutrients.map((item, index) => (
                <View style={styles.row} key={index}>
                  <Image
                    source={item.icon}
                    style={[styles.icon, { width: item.width }]}
                  />
                  <Text style={styles.label}>{item.label}</Text>
                  <Text style={styles.value}>{item.value * foodCount}</Text>
                </View>
              ))}
            </LinearGradient>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default FoodCard;

const styles = StyleSheet.create({
  card: {
    flexDirection: 'column',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 12,
    marginVertical: 8,
    marginHorizontal: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  sub_section: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  image: {
    width: 79,
    height: 79,
    borderRadius: 12,
    marginRight: 12,
  },
  icon: {
    // width: 22,
    height: 21,
    // marginRight: 4,
  },

  title: {
    fontWeight: 'bold',
    fontSize: 12,
    marginBottom: 6,
    width: 120,
    // backgroundColor: 'pink',
  },

  label: {
    fontSize: 10,
    color: '#666',
  },
  value: {
    fontSize: 10,
    // fontWeight: '600',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  bowlText: {
    fontSize: 10,
    color: '#888',
  },
  addText: {
    color: 'green',
    fontWeight: 'bold',
    fontSize: 10,
  },
  addText2: {
    color: 'red',
    fontWeight: 'bold',
    fontSize: 10,
  },

  container: {
    width: '70%',
    // height: '100%',
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    // backgroundColor: '#be5e5e',
  },

  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },

  nutrition: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    // backgroundColor: 'pink'
  },

  nutrition_2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    borderRadius: 12,
    marginTop: 10,
    paddingVertical: 8,

    backgroundColor: '#fff',
    borderRadius: 12,

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },

  row: {
    alignItems: 'center',
    // marginBottom: 4,
  },
});
