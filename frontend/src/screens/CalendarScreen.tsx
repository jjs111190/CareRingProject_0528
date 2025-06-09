import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Modal,
  Alert, Animated, Image, Button, Platform, Switch, ActionSheetIOS, ScrollView
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import PushNotification from 'react-native-push-notification';
type MedicineItem = {
  time: string;
  title: string;
  taken: boolean;
};

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const generateCalendar = (year: number, month: number) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const calendar = [];
  let day = 1;
  for (let i = 0; i < 6; i++) {
    const week = [];
    for (let j = 0; j < 7; j++) {
      if ((i === 0 && j < firstDay) || day > daysInMonth) week.push('');
      else week.push(day++);
    }
    calendar.push(week);
  }
  return calendar;
};

const CalendarScreen = () => {
  const route = useRoute();
  const nickname = route.params?.nickname || 'Guest';

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [day, setDay] = useState(today.getDate());
  const [title, setTitle] = useState('');
  const [repeat, setRepeat] = useState('none');
  const [enableAlarm, setEnableAlarm] = useState(false);
  const [medicineDates, setMedicineDates] = useState<string[]>([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [time, setTime] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedDateMedicines, setSelectedDateMedicines] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);  
  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const years = Array.from({ length: 5 }, (_, i) => today.getFullYear() + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const calendarData = generateCalendar(year, month - 1);

  useEffect(() => {
    PushNotification.createChannel({
      channelId: 'medicine-reminder',
      channelName: 'Medicine Reminder',
      importance: 4,
      vibrate: true,
    }, () => {});
  }, []);
  const fetchMedicineDates = async () => {
  try {
    const res = await fetch(`https://mycarering.loca.lt/medicines?year=${year}&month=${month}`);
    const data = await res.json();
    setMedicineDates(data.map((d: any) => d.date));
  } catch (err) {
    Alert.alert('Error', 'Failed to refresh data');
  }
};
useEffect(() => {
  fetchMedicineDates();
}, [year, month]);
  useEffect(() => {
    fetch(`https://mycarering.loca.lt/medicines?year=${year}&month=${month}`)
      .then(res => res.json())
      .then(data => setMedicineDates(data.map((d: any) => d.date)));
  }, [year, month]);

  const formatDate = (y: number, m: number, d: number) => {
    const mm = String(m).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  };
useEffect(() => {
  const todayFormatted = formatDate(today.getFullYear(), today.getMonth() + 1, today.getDate());
  setSelectedDate(todayFormatted);

  (async () => {
    try {
      const res = await fetch(`https://mycarering.loca.lt/medicines?date=${todayFormatted}`);
      const data = await res.json();
      setSelectedDateMedicines(
        data.map((item: any) => {
          const formattedTime = item.time.slice(0, 5); // "HH:mm:ss" → "HH:mm"
          return `${formattedTime} - ${item.title}`;
        })
      );
    } catch {
      setSelectedDateMedicines(['Failed to fetch medicines']);
    }
  })();
}, []);
  const getRepeatDates = (): string[] => {
    const base = new Date(year, month - 1, day);
    const dates: string[] = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date(base);
      date.setDate(base.getDate() + i);
      if (
        repeat === 'daily' ||
        (repeat === 'weekly' && [1, 4].includes(date.getDay()))
      ) {
        dates.push(formatDate(date.getFullYear(), date.getMonth() + 1, date.getDate()));
      }
    }
    if (repeat === 'none') dates.push(formatDate(year, month, day));
    return dates;
  };

  const handleAddMedicine = async () => {
  if (!title) return Alert.alert('Missing Input', 'Please enter medicine name.');
  if (isSubmitting) return; // 중복 방지

  setIsSubmitting(true); // 시작 시 true

  try {
    const repeatDates = getRepeatDates();
    const timeString = `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`;

    for (const date of repeatDates) {
      await fetch('https://mycarering.loca.lt/medicines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, time: timeString, title }),
      });

      if (enableAlarm) {
        PushNotification.localNotificationSchedule({
          channelId: 'medicine-reminder',
          title: '💊 Medicine Reminder',
          message: `Time to take ${title}`,
          date: new Date(`${date}T${timeString}:00`),
          allowWhileIdle: true,
        });
      }

      setMedicineDates(prev => Array.from(new Set([...prev, date])));
    }

    Alert.alert('Success', `"${title}" added with repeat: ${repeat}`);
    closeModal();
    setTitle('');
    setEnableAlarm(false);
    setDay(parseInt(repeatDates[0].split('-')[2]));
  } catch {
    Alert.alert('Error', 'Failed to add medicine.');
  } finally {
    setIsSubmitting(false); // 종료 시 false
  }
};
const toggleMedicineTaken = async (index: number) => {
  const updated = [...selectedDateMedicines];
  const item = updated[index];
  item.taken = !item.taken;

  setSelectedDateMedicines(updated);

  // 서버로 PATCH 요청 전송
  try {
    await fetch(`https://mycarering.loca.lt/medicines/toggle`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: selectedDate, time: item.time, title: item.title, taken: item.taken })
    });
  } catch {
    Alert.alert('Error', 'Failed to update taken status');
  }
};
  const handleDatePress = async (pressedDay: number) => {
  const selected = formatDate(year, month, pressedDay);
  setSelectedDate(selected);
  try {
    const res = await fetch(`https://mycarering.loca.lt/medicines?date=${selected}`);
    const data = await res.json();
    setSelectedDateMedicines(data); // taken 필드 포함된 데이터라고 가정
  } catch {
    setSelectedDateMedicines([]);
  }
};

  const handlePrevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };

  const handleNextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };
const openModal = () => {
  if (isModalVisible) return; // 이미 열려 있으면 아무것도 하지 않음
  setModalVisible(true);
  Animated.parallel([
    Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
  ]).start();
};

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 300, duration: 300, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setModalVisible(false));
  };

  const handleRepeatSelectIOS = () => {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: ['Cancel', 'No Repeat', 'Every Day', 'Every Mon/Thu'],
        cancelButtonIndex: 0,
      },
      i => {
        if (i === 1) setRepeat('none');
        else if (i === 2) setRepeat('daily');
        else if (i === 3) setRepeat('weekly');
      }
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
  <Text style={styles.header}>Calendar</Text>
  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
    <TouchableOpacity onPress={fetchMedicineDates} style={styles.refreshButton}>
      <Image source={require('../../assets/refresh.png')} style={styles.iconImage} />
    </TouchableOpacity>
    <TouchableOpacity style={styles.addButton} onPress={openModal} disabled={isModalVisible}>
      <Text style={styles.addButtonText}>＋</Text>
    </TouchableOpacity>
   
  </View>
</View>

      <View style={styles.calendarGrid}>
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={handlePrevMonth}><Text>{'<'}</Text></TouchableOpacity>
          <Text style={styles.monthLabel}>{monthNames[month - 1]} {year}</Text>
          <TouchableOpacity onPress={handleNextMonth}><Text>{'>'}</Text></TouchableOpacity>
        </View>
        <View style={styles.weekDays}>
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
            <Text key={day} style={styles.weekDayText}>{day}</Text>
          ))}
        </View>
        {calendarData.map((week, i) => (
          <View key={i} style={styles.weekRow}>
            {week.map((dayValue, j) => {
              const formatted = formatDate(year, month, dayValue);
              return (
                <TouchableOpacity
                  key={j}
                  style={styles.dayCell}
                  onPress={() => dayValue && handleDatePress(dayValue)}>
                  <Text style={[
  styles.dayText,
  medicineDates.includes(formatted) && styles.markedDay
]}>
  {dayValue}
</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      <Modal transparent visible={isModalVisible} animationType="none">
        <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}> 
          <Animated.View style={[styles.modalContent, { transform: [{ translateY: slideAnim }] }]}> 
            <View style={styles.titleRow}> 
              <Image source={require('../../assets/pill.png')} style={styles.pillIcon} />
              <Text style={styles.modalTitleText}>Add Medicine</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <Picker selectedValue={year} onValueChange={setYear} style={{ flex: 1.5 }}>{years.map(y => <Picker.Item key={y} label={`${y}`} value={y} />)}</Picker>
              <Picker selectedValue={month} onValueChange={setMonth} style={{ flex: 1 }}>{months.map(m => <Picker.Item key={m} label={`${m}`} value={m} />)}</Picker>
              <Picker selectedValue={day} onValueChange={setDay} style={{ flex: 1 }}>{days.map(d => <Picker.Item key={d} label={`${d}`} value={d} />)}</Picker>
            </View>

            <TouchableOpacity onPress={() => setShowTimePicker(true)} style={styles.input}>
              <Text>{`${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`}</Text>
            </TouchableOpacity>
            {showTimePicker && Platform.OS === 'ios' && (
  <Modal transparent={true} animationType="fade">
    <View style={styles.pickerModalContainer}>
      <View style={styles.pickerWrapper}>
        <DateTimePicker
          value={time}
          mode="time"
          is24Hour={true}
          display="spinner"
          onChange={(_, selectedTime) => {
            setShowTimePicker(false);
            if (selectedTime) setTime(selectedTime);
          }}
        />
        <Button title="Done" onPress={() => setShowTimePicker(false)} />
      </View>
    </View>
  </Modal>
)}

{showTimePicker && Platform.OS === 'android' && (
  <DateTimePicker
    value={time}
    mode="time"
    is24Hour={true}
    display="default"
    onChange={(_, selectedTime) => {
      setShowTimePicker(false);
      if (selectedTime) setTime(selectedTime);
    }}
  />
)}

            <TextInput placeholder="Medicine name" value={title} onChangeText={setTitle} style={styles.input} />

            <Text style={styles.label}>Repeat</Text>
           
            {Platform.OS === 'ios' ? (
  <TouchableOpacity
    onPress={handleRepeatSelectIOS}
    style={styles.input}
  >
    <Text>
      {repeat === 'none'
        ? 'No Repeat'
        : repeat === 'daily'
        ? 'Every Day'
        : 'Every Mon/Thu'}
    </Text>
  </TouchableOpacity>
) : (
  <View style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 6, marginBottom: 10 }}>
    <View style={styles.repeatPickerContainer}>
      <Picker
        selectedValue={repeat}
        onValueChange={setRepeat}
        style={styles.repeatPicker}
      >
        <Picker.Item label="No Repeat" value="none" />
        <Picker.Item label="Every Day" value="daily" />
        <Picker.Item label="Every Mon/Thu" value="weekly" />
      </Picker>
    </View>
  </View>
)}
           

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={styles.label}>Enable Alarm</Text>
              <Switch value={enableAlarm} onValueChange={setEnableAlarm} />
            </View>

           <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
  <Button title="Cancel" onPress={closeModal} />
  <Button title="Add" onPress={handleAddMedicine} disabled={isSubmitting} />
</View>
          </Animated.View>
        </Animated.View>
      </Modal>
 
      {/* 업데이트된 의약품 목록 디자인 */}
      {selectedDate && (
        
        <View style={styles.medicineSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Medicines on {selectedDate}</Text>
          <TouchableOpacity onPress={() => setSelectedDate(null)}>
  <Image source={require('../../assets/close.png')} style={styles.iconImage} />
</TouchableOpacity>
          </View>
          
          {selectedDateMedicines.length > 0 ? (
            <ScrollView style={styles.medicineList}>
              {selectedDateMedicines.map((m, i) => (
  <View key={i} style={styles.medicineItem}>
    <View style={styles.bulletPoint} />
    <Text style={styles.medicineText}>{`${m.time.slice(0, 5)} - ${m.title}`}</Text>
    <TouchableOpacity onPress={() => toggleMedicineTaken(i)}>
      <Image
        source={
          m.taken
            ? require('../../assets/check-filled.png')
            : require('../../assets/check-outline.png')
        }
        style={styles.iconImage}
      />
    </TouchableOpacity>
  </View>
))}
            </ScrollView>
          ) : (
            <View style={styles.emptyContainer}>
  <Image source={require('../../assets/inbox.png')} style={styles.iconImageLarge} />
  <Text style={styles.emptyText}>No medicines scheduled</Text>
</View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, backgroundColor: '#fafafa', paddingHorizontal: 20 },
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  header: { fontSize: 28, fontWeight: 'bold', color: '#4387E5' },
  addButton: { backgroundColor: '#4387E5', borderRadius: 12, width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  addButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold', lineHeight: 24 },
  calendarGrid: { backgroundColor: '#fff', borderRadius: 10, padding: 16 },
  monthNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  monthLabel: { fontWeight: 'bold', fontSize: 16 },
  weekDays: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  weekDayText: { width: 32, textAlign: 'center', color: '#444' },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  dayCell: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  dayText: { color: '#333' },
  markedDay: { textDecorationLine: 'underline', color: '#4387E5', fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: 'white', borderRadius: 16, padding: 20, width: '85%' },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  pillIcon: { width: 24, height: 24, marginRight: 8 },
  modalTitleText: { fontSize: 16, fontWeight: '600' },
  input: { backgroundColor: '#fff', borderRadius: 6, padding: 12, borderWidth: 1, borderColor: '#ccc', marginBottom: 10 },
  label: { fontSize: 14, fontWeight: '500' },
  repeatPickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    marginBottom: 10,
    height: 40,
    overflow: 'hidden',
  },
  repeatPicker: {
    fontSize: 12,
    height: 40,
  },
  pickerModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  pickerWrapper: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  
  // 업데이트된 의약품 목록 스타일
  medicineSection: {
    marginTop: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#444',
  },
  medicineList: {
    maxHeight: 150,
  },
  medicineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f8f8',
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4387E5',
    marginRight: 12,
  },
  medicineText: {
    fontSize: 14,
    color: '#555',
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    marginTop: 8,
    color: '#999',
    fontSize: 14,
  },
  iconImage: {
  width: 20,
  height: 20,
  tintColor: '#777',
},
iconImageLarge: {
  width: 24,
  height: 24,
  tintColor: '#ccc',
  marginBottom: 4,
},refreshButton: {
  marginRight: 8,
  padding: 6,
  borderRadius: 6,
  backgroundColor: '#E0E7F9',
  alignItems: 'center',
  justifyContent: 'center',
  width: 24,
  height: 24,
},
});

export default CalendarScreen;