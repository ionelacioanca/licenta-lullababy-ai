import React, { useState, useEffect } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  CalendarEvent,
  getMonthEvents,
  addCalendarEvent,
  updateCalendarEvent,
  toggleEventCompleted,
  deleteCalendarEvent,
  generateVaccinationSchedule,
  generateMilestoneSchedule,
} from '../services/calendarService';

interface CalendarModalProps {
  visible: boolean;
  onClose: () => void;
  babyId: string;
  onEventsUpdate?: () => void;
}

const EVENT_TYPE_COLORS = {
  vaccination: '#FF6B6B',
  checkup: '#4ECDC4',
  milestone: '#FFD93D',
  medication: '#A2E884',
  appointment: '#6B4FA0',
  other: '#95A5A6',
};

const EVENT_TYPE_ICONS = {
  vaccination: 'medical' as const,
  checkup: 'fitness' as const,
  milestone: 'star' as const,
  medication: 'medkit' as const,
  appointment: 'calendar' as const,
  other: 'bookmark' as const,
};

const CalendarModal: React.FC<CalendarModalProps> = ({ visible, onClose, babyId, onEventsUpdate }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDescription, setNewEventDescription] = useState('');
  const [newEventType, setNewEventType] = useState<CalendarEvent['type']>('other');
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);

  useEffect(() => {
    if (visible && babyId) {
      loadEvents();
    }
  }, [visible, babyId, currentDate]);

  const loadEvents = async () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const fetchedEvents = await getMonthEvents(babyId, year, month);
    setEvents(fetchedEvents);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const changeMonth = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const handleDatePress = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(date);
    setShowAddForm(true);
  };

  const handleAddEvent = async () => {
    if (!newEventTitle.trim() || !selectedDate) {
      Alert.alert('Error', 'Please enter an event title');
      return;
    }

    try {
      await addCalendarEvent({
        babyId,
        title: newEventTitle,
        description: newEventDescription,
        date: selectedDate.toISOString(),
        type: newEventType,
        reminder: true,
        reminderDays: 1,
      });

      setNewEventTitle('');
      setNewEventDescription('');
      setNewEventType('other');
      setShowAddForm(false);
      setSelectedDate(null);
      loadEvents();
      onEventsUpdate?.();
    } catch (error) {
      Alert.alert('Error', 'Failed to add event');
    }
  };

  const handleToggleComplete = async (eventId: string, currentStatus: boolean) => {
    try {
      await toggleEventCompleted(eventId, !currentStatus);
      loadEvents();
      onEventsUpdate?.();
    } catch (error) {
      Alert.alert('Error', 'Failed to update event');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    Alert.alert('Delete Event', 'Are you sure you want to delete this event?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCalendarEvent(eventId);
            loadEvents();
            onEventsUpdate?.();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete event');
          }
        },
      },
    ]);
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event);
    setNewEventTitle(event.title);
    setNewEventDescription(event.description || '');
    setNewEventType(event.type);
    setShowEditForm(true);
    setExpandedEvent(null);
  };

  const handleUpdateEvent = async () => {
    if (!newEventTitle.trim() || !editingEvent) {
      Alert.alert('Error', 'Please enter an event title');
      return;
    }

    try {
      await updateCalendarEvent(editingEvent._id, {
        title: newEventTitle,
        description: newEventDescription,
        type: newEventType,
      });

      setNewEventTitle('');
      setNewEventDescription('');
      setNewEventType('other');
      setShowEditForm(false);
      setEditingEvent(null);
      loadEvents();
      onEventsUpdate?.();
    } catch (error) {
      Alert.alert('Error', 'Failed to update event');
    }
  };

  const handleGenerateSchedules = async () => {
    Alert.alert(
      'Generate Schedules',
      'Generate vaccination and milestone schedules for your baby?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Generate',
          onPress: async () => {
            try {
              await generateVaccinationSchedule(babyId);
              await generateMilestoneSchedule(babyId);
              Alert.alert('Success', 'Schedules generated successfully!');
              loadEvents();
              onEventsUpdate?.();
            } catch (error) {
              Alert.alert('Error', 'Failed to generate schedules');
            }
          },
        },
      ]
    );
  };

  const renderCalendarGrid = () => {
    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dayEvents = getEventsForDate(date);
      const isToday =
        date.getDate() === new Date().getDate() &&
        date.getMonth() === new Date().getMonth() &&
        date.getFullYear() === new Date().getFullYear();

      days.push(
        <TouchableOpacity
          key={day}
          style={[styles.dayCell, isToday && styles.todayCell]}
          onPress={() => handleDatePress(day)}
        >
          <Text style={[styles.dayText, isToday && styles.todayText]}>{day}</Text>
          {dayEvents.length > 0 && (
            <View style={styles.eventDots}>
              {dayEvents.slice(0, 3).map((event) => (
                <View
                  key={event._id}
                  style={[
                    styles.eventDot,
                    { backgroundColor: EVENT_TYPE_COLORS[event.type] },
                  ]}
                />
              ))}
            </View>
          )}
        </TouchableOpacity>
      );
    }

    return <View style={styles.calendarGrid}>{days}</View>;
  };

  const renderEventsList = () => {
    const sortedEvents = [...events].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return (
      <ScrollView style={styles.eventsList} showsVerticalScrollIndicator={false}>
        {sortedEvents.map((event) => {
          const eventDate = new Date(event.date);
          const isExpanded = expandedEvent === event._id;

          return (
            <TouchableOpacity
              key={event._id}
              style={styles.eventItem}
              onPress={() => setExpandedEvent(isExpanded ? null : event._id)}
              activeOpacity={0.7}
            >
              <View style={styles.eventHeader}>
                <View style={styles.eventIconContainer}>
                  <View
                    style={[
                      styles.eventIcon,
                      { backgroundColor: EVENT_TYPE_COLORS[event.type] },
                    ]}
                  >
                    <Ionicons
                      name={EVENT_TYPE_ICONS[event.type]}
                      size={18}
                      color="white"
                    />
                  </View>
                </View>

                <View style={styles.eventInfo}>
                  <Text style={[styles.eventTitle, event.completed && styles.completedText]}>
                    {event.title}
                  </Text>
                  <Text style={styles.eventDate}>
                    {eventDate.toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                    {event.time && ` at ${event.time}`}
                  </Text>
                </View>

                <View style={styles.eventActions}>
                  <TouchableOpacity
                    onPress={() => handleToggleComplete(event._id, event.completed)}
                    style={styles.actionButton}
                  >
                    <Ionicons
                      name={event.completed ? 'checkmark-circle' : 'checkmark-circle-outline'}
                      size={24}
                      color={event.completed ? '#A2E884' : '#999'}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {isExpanded && (
                <View style={styles.eventDetails}>
                  {event.description && (
                    <Text style={styles.eventDescription}>{event.description}</Text>
                  )}
                  <View style={styles.eventMeta}>
                    <View style={styles.metaItem}>
                      <Ionicons name="pricetag" size={14} color="#999" />
                      <Text style={styles.metaText}>{event.type}</Text>
                    </View>
                    {event.autoGenerated && (
                      <View style={styles.metaItem}>
                        <Ionicons name="flash" size={14} color="#999" />
                        <Text style={styles.metaText}>Auto-generated</Text>
                      </View>
                    )}
                  </View>
                  {!event.autoGenerated && (
                    <View style={styles.eventButtons}>
                      <TouchableOpacity
                        onPress={() => handleEditEvent(event)}
                        style={styles.editButton}
                      >
                        <Ionicons name="create-outline" size={16} color="#6B4FA0" />
                        <Text style={styles.editText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeleteEvent(event._id)}
                        style={styles.deleteButton}
                      >
                        <Ionicons name="trash-outline" size={16} color="#FF6B6B" />
                        <Text style={styles.deleteText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        {sortedEvents.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color="#CCC" />
            <Text style={styles.emptyText}>No events this month</Text>
            <TouchableOpacity onPress={handleGenerateSchedules} style={styles.generateButton}>
              <Text style={styles.generateButtonText}>Generate Schedules</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
            <Text style={styles.title}>Calendar</Text>
            <TouchableOpacity onPress={handleGenerateSchedules} style={styles.headerButton}>
              <Ionicons name="add-circle-outline" size={28} color="#A2E884" />
            </TouchableOpacity>
          </View>

          <View style={styles.monthHeader}>
            <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.monthButton}>
              <Ionicons name="chevron-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.monthText}>
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </Text>
            <TouchableOpacity onPress={() => changeMonth(1)} style={styles.monthButton}>
              <Ionicons name="chevron-forward" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.weekDays}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <Text key={day} style={styles.weekDayText}>
                {day}
              </Text>
            ))}
          </View>

          {renderCalendarGrid()}

          <View style={styles.eventsSection}>
            <Text style={styles.sectionTitle}>Events</Text>
            {renderEventsList()}
          </View>

          {showAddForm && selectedDate && (
            <KeyboardAvoidingView 
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.addForm}
            >
              <ScrollView 
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
              >
                <Text style={styles.formTitle}>
                  Add Event - {selectedDate.toLocaleDateString()}
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Event title"
                  value={newEventTitle}
                  onChangeText={setNewEventTitle}
                  placeholderTextColor="#999"
                />
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Description (optional)"
                  value={newEventDescription}
                  onChangeText={setNewEventDescription}
                  multiline
                  numberOfLines={3}
                  placeholderTextColor="#999"
                />
                <View style={styles.typeSelector}>
                  {Object.keys(EVENT_TYPE_COLORS).map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typeButton,
                        newEventType === type && styles.typeButtonActive,
                        { borderColor: EVENT_TYPE_COLORS[type as keyof typeof EVENT_TYPE_COLORS] },
                      ]}
                      onPress={() => setNewEventType(type as CalendarEvent['type'])}
                    >
                      <Text style={styles.typeButtonText}>{type}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.formButtons}>
                  <TouchableOpacity
                    style={[styles.formButton, styles.cancelButton]}
                    onPress={() => {
                      setShowAddForm(false);
                      setNewEventTitle('');
                      setNewEventDescription('');
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.formButton, styles.saveButton]}
                    onPress={handleAddEvent}
                  >
                    <Text style={styles.saveButtonText}>Add Event</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          )}

          {showEditForm && editingEvent && (
            <KeyboardAvoidingView 
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.addForm}
            >
              <ScrollView 
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
              >
                <Text style={styles.formTitle}>
                  Edit Event
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Event title"
                  value={newEventTitle}
                  onChangeText={setNewEventTitle}
                  placeholderTextColor="#999"
                />
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Description (optional)"
                  value={newEventDescription}
                  onChangeText={setNewEventDescription}
                  multiline
                  numberOfLines={3}
                  placeholderTextColor="#999"
                />
                <View style={styles.typeSelector}>
                  {Object.keys(EVENT_TYPE_COLORS).map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typeButton,
                        newEventType === type && styles.typeButtonActive,
                        { borderColor: EVENT_TYPE_COLORS[type as keyof typeof EVENT_TYPE_COLORS] },
                      ]}
                      onPress={() => setNewEventType(type as CalendarEvent['type'])}
                    >
                      <Text style={styles.typeButtonText}>{type}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.formButtons}>
                  <TouchableOpacity
                    style={[styles.formButton, styles.cancelButton]}
                    onPress={() => {
                      setShowEditForm(false);
                      setEditingEvent(null);
                      setNewEventTitle('');
                      setNewEventDescription('');
                      setNewEventType('other');
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.formButton, styles.saveButton]}
                    onPress={handleUpdateEvent}
                  >
                    <Text style={styles.saveButtonText}>Update Event</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFF8F0',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '90%',
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  closeButton: {
    padding: 4,
  },
  headerButton: {
    padding: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  monthButton: {
    padding: 8,
  },
  monthText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  weekDays: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  todayCell: {
    backgroundColor: '#A2E884',
    borderRadius: 8,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  todayText: {
    color: 'white',
    fontWeight: '700',
  },
  eventDots: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
  },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  eventsSection: {
    flex: 1,
    paddingTop: 16,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  eventsList: {
    flex: 1,
  },
  eventItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventIconContainer: {
    marginRight: 12,
  },
  eventIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  eventDate: {
    fontSize: 13,
    color: '#666',
  },
  eventActions: {
    marginLeft: 8,
  },
  actionButton: {
    padding: 4,
  },
  eventDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  eventDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  eventMeta: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#999',
    textTransform: 'capitalize',
  },
  eventButtons: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editText: {
    fontSize: 14,
    color: '#6B4FA0',
    fontWeight: '500',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deleteText: {
    fontSize: 14,
    color: '#FF6B6B',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
    marginBottom: 16,
  },
  generateButton: {
    backgroundColor: '#A2E884',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  generateButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  addForm: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -2 },
    elevation: 8,
    maxHeight: '70%',
  },
  scrollContent: {
    paddingBottom: 60,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#333',
    marginBottom: 12,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  typeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  typeButtonActive: {
    borderWidth: 2,
  },
  typeButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
    textTransform: 'capitalize',
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  formButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F0F0F0',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  saveButton: {
    backgroundColor: '#A2E884',
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
  },
});

export default CalendarModal;
