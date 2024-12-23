import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, FlatList, ScrollView } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient'; // Gradient import for styling

// HomeScreen component
function HomeScreen({ navigation, route }) {
  const [clientName, setClientName] = useState('');
  const [clientNumber, setClientNumber] = useState(''); // Client number state
  const [service, setService] = useState('wash');
  const [orderList, setOrderList] = useState([]);
  const [transactionHistory, setTransactionHistory] = useState(route.params?.transactionHistory || []);
  const [totalAmount, setTotalAmount] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editedClientName, setEditedClientName] = useState(''); // To edit client name
  const [paymentAmount, setPaymentAmount] = useState('');
  const [remainingBalance, setRemainingBalance] = useState(0);

  const serviceOptions = [
    { label: 'Wash/Load', value: 'wash', price: 70 },
    { label: 'Dry/Load', value: 'dry', price: 70 },
    { label: 'Fold/Load', value: 'fold', price: 30 },
    { label: 'Full Service', value: 'full', price: 170 },
  ];

  const addOrUpdateService = () => {
    if (clientName.trim() === '' && !isEditing) {
      Alert.alert('Error', "Please enter the client's name.");
      return;
    }

    const selectedService = serviceOptions.find((option) => option.value === service);

    if (!selectedService) {
      Alert.alert('Error', 'Please select a valid service.');
      return;
    }

    if (isEditing) {
      const updatedOrderList = orderList.map((item) => {
        if (item.id === editingId) {
          return { ...item, service: selectedService.label, price: selectedService.price, clientName };
        }
        return item;
      });

      const oldItem = orderList.find((item) => item.id === editingId);
      setTotalAmount(totalAmount - oldItem.price + selectedService.price);

      setOrderList(updatedOrderList);
      setIsEditing(false);
      setEditingId(null);
    } else {
      const newService = { 
        id: Date.now().toString(), 
        clientName, 
        service: selectedService.label, 
        price: selectedService.price 
      };
      setOrderList([...orderList, newService]);
      setTotalAmount(totalAmount + selectedService.price);
    }
  };

  const removeService = (id) => {
    const itemToRemove = orderList.find((item) => item.id === id);
    if (itemToRemove) {
      setOrderList(orderList.filter((item) => item.id !== id));
      setTotalAmount(totalAmount - itemToRemove.price);
    }
  };

  const editService = (id) => {
    const itemToEdit = orderList.find((item) => item.id === id);
    if (itemToEdit) {
      setIsEditing(true);
      setEditingId(id);
      setService(serviceOptions.find((option) => option.label === itemToEdit.service)?.value || 'wash');
    }
  };

  const processPayment = () => {
    if (orderList.length === 0) {
      Alert.alert('Error', 'No services added to the order.');
      return;
    }

    const enteredAmount = parseFloat(paymentAmount);

    if (isNaN(enteredAmount) || enteredAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid payment amount.');
      return;
    }

    const totalAmountToPay = totalAmount;

    if (enteredAmount >= totalAmountToPay) {
      const change = enteredAmount - totalAmountToPay;
       Alert.alert('Payment Successful', `Total Amount Paid: ₱${totalAmountToPay.toFixed(2)}. Change: ₱${change.toFixed(2)}`);
      setTransactionHistory([...transactionHistory, {
        id: Date.now().toString(),
        clientName,
        clientNumber,
        orders: orderList,
        total: totalAmountToPay,
        dateTime: new Date().toLocaleString(),
      }]);
      setOrderList([]);
      setClientName('');
      setClientNumber('');
      setTotalAmount(0);
      setPaymentAmount('');
      setRemainingBalance(0);
    } else {
      const newBalance = totalAmountToPay - enteredAmount;
      setRemainingBalance(newBalance);
      Alert.alert('Payment Received', `Amount Paid: ₱${enteredAmount.toFixed(2)}. Remaining Balance: ₱${newBalance.toFixed(2)}`);
    }
  };

  const handleClientNameChange = (text) => {
    setClientName(text);
    if (isEditing) {
      setEditedClientName(text); // Allow editing of the client name if in edit mode
    }
  };

  const handleClientNumberChange = (text) => {
    setClientNumber(text);
    if (isEditing) {
      setClientNumber(text);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#ffd4dd', '#bbaef7']} style={styles.gradientBackground}>
        <Text style={styles.title}>LaundryPay</Text>

        <TextInput
          style={styles.input}
          placeholder="Client's Name"
          value={clientName}
          onChangeText={handleClientNameChange}
        />

        <TextInput
          style={styles.input}
          placeholder="Client's Number"
          value={clientNumber}
          onChangeText={handleClientNumberChange}
          keyboardType="numeric" // Restrict to numeric input
        />

        <Text style={styles.label}>Select Service:</Text>
        <View style={styles.pickerContainer}>
          <Picker selectedValue={service} onValueChange={(itemValue) => setService(itemValue)}>
            {serviceOptions.map((option) => (
              <Picker.Item key={option.value} label={option.label} value={option.value} />
            ))}
          </Picker>
        </View>

        <TouchableOpacity style={styles.addButton} onPress={addOrUpdateService}>
          <Text style={styles.buttonText}>{isEditing ? 'Update Service' : 'Add Service'}</Text>
        </TouchableOpacity>

        <FlatList
          data={orderList}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.orderItem}>
              <Text style={styles.orderText}>{item.clientName} - {item.service}: ₱{item.price.toFixed(2)}</Text>
              <View style={styles.buttonGroup}>
                <TouchableOpacity onPress={() => editService(item.id)} style={styles.editButton}>
                  <Text style={styles.buttonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => removeService(item.id)} style={styles.removeButton}>
                  <Text style={styles.buttonText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />

        <View style={styles.totalContainer}>
          <Text style={styles.totalText}>Total: ₱{totalAmount.toFixed(2)}</Text>
          <TextInput
            style={styles.inputAmount}
            placeholder="Enter Amount"
            keyboardType="numeric"
            onChangeText={(text) => setPaymentAmount(text)}
            value={paymentAmount}
          />
        </View>

        <TouchableOpacity style={styles.paymentButton} onPress={processPayment}>
          <Text style={styles.buttonText}>Process Payment</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => navigation.navigate('TransactionHistory', { transactionHistory })}
        >
          <Text style={styles.buttonText}>View Transaction History</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}

// TransactionHistoryScreen component
function TransactionHistoryScreen({ route }) {
  const { transactionHistory } = route.params;

  const [searchQuery, setSearchQuery] = useState('');

  const filteredHistory = transactionHistory.filter((transaction) =>
    transaction.clientName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#ffd4dd', '#bbaef7']} style={styles.gradientBackground}>
        <Text style={styles.historyTitle}>Transaction History</Text>

        <TextInput
          style={styles.searchInput}
          placeholder="Search by client name"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

<FlatList
        data={filteredHistory}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.historyItem}>
            <Text style={styles.historyText}>
              <Text style={styles.normalText}>Client: </Text> 
              <Text style={styles.boldText}>{item.clientName} ({item.clientNumber})</Text>
            </Text>
            <Text style={styles.historyText}>
              <Text style={styles.normalText}>Transaction ID: </Text> 
              <Text style={styles.boldText}>{item.id}</Text>
            </Text>
            <Text style={styles.historyText}>
              <Text style={styles.normalText}>Date & Time: </Text> 
              <Text style={styles.boldText}>{item.dateTime}</Text>
            </Text>
            <Text style={styles.historyText}>
              <Text style={styles.normalText}>Total: </Text> 
              <Text style={styles.boldText}>₱{item.total.toFixed(2)}</Text>
            </Text>
            <FlatList
              data={item.orders}
              keyExtractor={(order) => order.id}
              renderItem={({ item: order }) => (
                <Text style={styles.historyText}>
                  <Text style={styles.normalText}>{order.service}: </Text>
                  <Text style={styles.boldText}> ₱{order.price.toFixed(2)}</Text>
                </Text>
              )}
            />
          </View>
        )}
      />
      </LinearGradient>
    </View>
  );
}

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="TransactionHistory" component={TransactionHistoryScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    flexGrow: 1, // Ensures the content is scrollable
    justifyContent: 'center',
    padding: 20,
  },
  gradientBackground: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#606676',
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    color: '#606676',
    marginBottom: 10,
  },
  pickerContainer: {
    width: '100%',
    marginBottom: 15,
    borderWidth: 1,
    borderRadius: 8,
    height: 50,
    borderColor: '#9E9FA5',
  },
  input: {
    height: 40,
    width: '100%',
    padding: 8,
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  inputAmount: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    width: 150,
    backgroundColor: '#fff',
    textAlign: 'center',
    fontSize: 16,
  },
  addButton: {
    backgroundColor: 'green',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  orderListContainer: {
    width: '100%',
    marginBottom: 20,
  },
  orderItem: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    elevation: 3,
  },
  orderText: {
    fontSize: 16,
    color: '#606676',
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  editButton: {
    backgroundColor: '#4CAF50',
    padding: 5,
    borderRadius: 5,
  },
  removeButton: {
    backgroundColor: '#F44336',
    padding: 5,
    borderRadius: 5,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
    width: '95%',
  },
  totalText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#606676',
    padding: 15,
  },
  paymentButton: {
    backgroundColor: 'green',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  historyButton: {
    backgroundColor: 'blue',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  searchInput: {
    height: 40,
    width: '100%',
    padding: 8,
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  historyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    color: '#606676',
  },
  historyContainer: {
    width: '100%',
  },
  historyItem: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
  },
  historyText: {
    fontSize: 16,
    marginBottom: 5,
  },
  normalText: {
    fontWeight: 'normal',
  },
  boldText: {
    fontWeight: 'bold',
  },
});