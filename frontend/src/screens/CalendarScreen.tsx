// CalendarScreen.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Image } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

const generateCalendar = (year: number, month: number) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const calendar = [];
  let day = 1;
  for (let i = 0; i < 6; i++) {
    const week = [];
    for (let j = 0; j < 7; j++) {
      if ((i === 0 && j < firstDay) || day > daysInMonth) {
        week.push('');
      } else {
        week.push(day);
        day++;
      }
    }
    calendar.push(week);
  }
  return calendar;
};

const CalendarScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();

  // route.params.nickname 으로 닉네임 전달받음 (기본값은 Guest)
  const nickname = route.params?.nickname || 'Guest';

  const [selectedDate, setSelectedDate] = useState('25/11/2022');
  const calendarData = generateCalendar(2022, 10);

  const handleDatePress = (day: number) => {
    const dateString = `${day}/11/2022`;
    navigation.navigate('Detail', {
      date: dateString,
      schedule: schedules[dateString] || []
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Calendar</Text>
        <View style={styles.profileGroup}>
          <Image source={require('../../assets/profile.png')} style={styles.profileIcon} />
          <Text style={styles.userName}>{nickname}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('ChatScreen')}>
            <Image source={require('../../assets/chatbubble.png')} style={styles.chatIcon} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputWrapper}>
        <Text style={styles.inputLabel}>Date</Text>
        <TextInput style={styles.input} value={selectedDate} editable={false} />
      </View>

      <View style={styles.calendarGrid}>
        <Text style={styles.monthLabel}>November 2022</Text>
        <View style={styles.weekDays}>
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
            <Text key={day} style={styles.weekDayText}>{day}</Text>
          ))}
        </View>

        {calendarData.map((week, i) => (
          <View key={i} style={styles.weekRow}>
            {week.map((day, j) => (
              <TouchableOpacity
                key={j}
                style={styles.dayCell}
                onPress={() => day && handleDatePress(day)}
              >
                <Text style={styles.dayText}>{day}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    backgroundColor: '#fafafa',
    paddingHorizontal: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#678CC8',
  },
  profileGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileIcon: {
    width: 24,
    height: 24,
    marginRight: 4,
  },
  chatIcon: {
    width: 20,
    height: 20,
    marginLeft: 6,
  },
  userName: {
    color: '#555',
    fontSize: 12,
  },
  inputWrapper: {
    backgroundColor: '#eee',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  inputLabel: {
    color: '#555',
    marginBottom: 6,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  calendarGrid: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
  },
  monthLabel: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 12,
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  weekDayText: {
    width: 32,
    textAlign: 'center',
    color: '#444',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  dayCell: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    color: '#333',
  },
});

const schedules = {
  '25/11/2022': [
    { time: '8:00', title: 'Tylenol 500mg, 1 pill' },
    { time: '10:00', title: 'Walking (3.2 km)' },
    { time: '10:30', title: 'Tylenol 500mg, 1 pill' },
  ],
};

export default CalendarScreen;
