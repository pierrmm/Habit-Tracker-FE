
import { useColorScheme } from '@/hooks/useColorScheme';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, SafeAreaView, ScrollView, TextInput, TouchableOpacity, View } from 'react-native';
import tw from 'twrnc';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

// Define the Ibadah type
interface Ibadah {
  id: number;
  nama_ibadah: string;
  jenis_ibadah: 'wajib' | 'sunah';
  tanggal_ibadah: string;
  created_at: string;
  updated_at: string;
}

// API base URL - automatically adjust for platform
const getApiUrl = () => {
  return 'https://7b15-182-253-179-88.ngrok-free.app/api';
};



export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [ibadahs, setIbadahs] = useState<Ibadah[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Form state
  const [formData, setFormData] = useState({
    nama_ibadah: '',
    jenis_ibadah: 'wajib',
    tanggal_ibadah: new Date().toISOString().split('T')[0],
  });

  // Add this with your other state declarations
  const [validationError, setValidationError] = useState<string | null>(null);

  // Edit mode state
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  // Custom web alert states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  // Helper function to generate calendar days
  const generateCalendarDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();

    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);

    // Get the day of the week for the first day (0 = Sunday, 6 = Saturday)
    const firstDayOfWeek = firstDay.getDay();

    // Calculate days from previous month to show
    const daysFromPrevMonth = firstDayOfWeek;

    // Calculate total days to show (max 6 weeks = 42 days)
    const totalDays = 42;

    // Generate array of date objects
    const days: Date[] = [];

    // Add days from previous month
    for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
      const prevMonthDay = new Date(year, month, -i);
      days.push(prevMonthDay);
    }

    // Add days from current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const currentMonthDay = new Date(year, month, i);
      days.push(currentMonthDay);
    }

    // Add days from next month to fill the grid
    const remainingDays = totalDays - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const nextMonthDay = new Date(year, month + 1, i);
      days.push(nextMonthDay);
    }

    // Split into weeks
    const weeks: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    return weeks;
  };

  // Fetch all ibadah records
  // Fetch all ibadah records
  const fetchIbadahs = async () => {
    try {
      setLoading(true);
      const apiUrl = getApiUrl();
      console.log(`Fetching from: ${apiUrl}/ibadah`);
      const response = await axios.get(`${apiUrl}/ibadah`);
      console.log('Fetch response:', response.data);
      setIbadahs(response.data.data || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please try again.');

      // More detailed error logging
      if (err.response) {
        console.error('Error response:', err.response.data);
        console.error('Error status:', err.response.status);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Create new ibadah
  const createIbadah = async () => {
    if (!formData.nama_ibadah.trim()) {
      Alert.alert('Validation Error', 'Nama ibadah tidak boleh kosong');
      return;
    }

    try {
      setLoading(true);
      const apiUrl = getApiUrl();
      await axios.post(`${apiUrl}/ibadah`, formData);
      // Reset form
      setFormData({
        nama_ibadah: '',
        jenis_ibadah: 'wajib',
        tanggal_ibadah: new Date().toISOString().split('T')[0],
      });
      // Refresh data
      fetchIbadahs();
      Alert.alert('Success', 'Ibadah berhasil ditambahkan');
    } catch (err: any) {
      console.error('Error creating ibadah:', err);
      if (err.response?.data?.errors) {
        const errorMessages = Object.values(err.response.data.errors).flat().join('\n');
        Alert.alert('Validation Error', errorMessages);
      } else {
        Alert.alert('Error', 'Failed to create ibadah. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Update existing ibadah
  const updateIbadah = async () => {
    if (!editId) return;

    if (!formData.nama_ibadah.trim()) {
      Alert.alert('Validation Error', 'Nama ibadah tidak boleh kosong');
      return;
    }

    try {
      setLoading(true);
      const apiUrl = getApiUrl();
      await axios.put(`${apiUrl}/ibadah/${editId}`, formData);
      // Reset form and edit mode
      setFormData({
        nama_ibadah: '',
        jenis_ibadah: 'wajib',
        tanggal_ibadah: new Date().toISOString().split('T')[0],
      });
      setEditMode(false);
      setEditId(null);
      // Refresh data
      fetchIbadahs();
      Alert.alert('Success', 'Ibadah berhasil diperbarui');
    } catch (err: any) {
      console.error('Error updating ibadah:', err);
      if (err.response?.data?.errors) {
        const errorMessages = Object.values(err.response.data.errors).flat().join('\n');
        Alert.alert('Validation Error', errorMessages);
      } else {
        Alert.alert('Error', 'Failed to update ibadah. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Delete ibadah
  const deleteIbadah = async (id: number) => {
    try {
      setLoading(true);
      const apiUrl = getApiUrl();
      console.log(`Attempting to delete ibadah with ID: ${id}`);
      console.log(`DELETE request URL: ${apiUrl}/ibadah/${id}`);

      const response = await axios.delete(`${apiUrl}/ibadah/${id}`);
      console.log('Delete response:', response.data);

      // Update the UI regardless of the response format
      setIbadahs(prevIbadahs => prevIbadahs.filter(item => item.id !== id));
      Alert.alert('Success', 'Ibadah berhasil dihapus');

    } catch (err: any) {
      console.error('Error deleting ibadah:', err);

      if (err.response) {
        console.error('Error response data:', err.response.data);
        console.error('Error response status:', err.response.status);
        Alert.alert('Server Error', `Status: ${err.response.status}\nMessage: ${JSON.stringify(err.response.data)}`);
      } else if (err.request) {
        console.error('Error request:', err.request);
        Alert.alert('Network Error', 'No response received from server. Check your connection.');
      } else {
        console.error('Error message:', err.message);
        Alert.alert('Error', `Request failed: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle edit button press
  const handleEdit = (ibadah: Ibadah) => {
    setFormData({
      nama_ibadah: ibadah.nama_ibadah,
      jenis_ibadah: ibadah.jenis_ibadah,
      tanggal_ibadah: ibadah.tanggal_ibadah,
    });
    setEditMode(true);
    setEditId(ibadah.id);
  };

  // Handle form submission
  // Handle form submission
  const handleSubmit = () => {
    // Validate form data
    if (!formData.nama_ibadah.trim()) {
      // Show platform-specific alert for empty name field
      if (Platform.OS === 'web') {
        // For web, we can use browser alert or add a validation message in the UI
        // We'll add a state to track validation errors
        setValidationError('Nama ibadah tidak boleh kosong');

        // Automatically clear the error after 3 seconds
        setTimeout(() => {
          setValidationError(null);
        }, 3000);
      } else {
        // For native platforms, use Alert
        Alert.alert('Validation Error', 'Nama ibadah tidak boleh kosong');
      }
      return;
    }

    // Clear any validation errors
    setValidationError(null);

    // Proceed with form submission
    if (editMode) {
      updateIbadah();
    } else {
      createIbadah();
    }
  };

  // Cancel edit mode
  const cancelEdit = () => {
    setFormData({
      nama_ibadah: '',
      jenis_ibadah: 'wajib',
      tanggal_ibadah: new Date().toISOString().split('T')[0],
    });
    setEditMode(false);
    setEditId(null);
  };

  // Confirm delete
  // Confirm delete with platform-specific implementation
  const confirmDelete = (id: number) => {
    console.log('confirmDelete called with ID:', id);

    if (Platform.OS === 'web') {
      // For web, use custom modal
      setPendingDeleteId(id);
      setShowDeleteModal(true);
    } else {
      // For native platforms, use Alert
      Alert.alert(
        'Konfirmasi',
        'Apakah Anda yakin ingin menghapus ibadah ini?',
        [
          { text: 'Batal', style: 'cancel' },
          {
            text: 'Hapus',
            onPress: () => {
              console.log('Delete confirmed for ID:', id);
              deleteIbadah(id);
            },
            style: 'destructive'
          },
        ],
        { cancelable: true }
      );
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchIbadahs();
  };

  // Load data on component mount
  useEffect(() => {
    fetchIbadahs();
  }, []);

  return (
    <SafeAreaView style={tw`flex-1 mt-5 0 p-4`}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={tw`flex-1`}>

        <ThemedView style={tw`mb-6 bg-black`}>
          <ThemedText type="title">Habit Tracker</ThemedText>
          <ThemedText style={tw`text-gray-600 dark:text-gray-300`}>Track your daily ibadah activities</ThemedText>
        </ThemedView>

        {/* Form Section */}
        <ThemedView style={tw`bg-gray-800 p-5 rounded-xl mb-6 shadow-white/5`}>
          <ThemedText type="subtitle" style={tw`mb-4 ${editMode ? 'text-yellow-400' : ''}`}>
            {editMode ? '✏️ Edit Ibadah' : '➕ Tambah Ibadah Baru'}
          </ThemedText>

          <View style={tw`mb-4`}>
            <ThemedText style={tw`mb-1 font-medium`}>Nama Ibadah <ThemedText style={tw`text-red-500`}>*</ThemedText></ThemedText>
            <TextInput
              style={tw`bg-gray-700 p-3 rounded-lg text-white border ${formData.nama_ibadah.trim() === '' || validationError ? 'border-red-500' : 'border-gray-600'
                }`}
              value={formData.nama_ibadah}
              onChangeText={(text) => setFormData({ ...formData, nama_ibadah: text })}
              placeholder="Masukkan nama ibadah"
              placeholderTextColor="#999"
            />
            {validationError && (
              <ThemedText style={tw`text-red-500 mt-1`}>
                {validationError}
              </ThemedText>
            )}
          </View>

          <View style={tw`mb-4`}>
            <ThemedText style={tw`mb-1 font-medium`}>Jenis Ibadah</ThemedText>
            <View style={tw`flex-row`}>
              <TouchableOpacity
                style={tw`flex-1 p-3 rounded-l-lg ${formData.jenis_ibadah === 'wajib'
                  ? 'bg-blue-600'
                  : 'bg-gray-600'
                  }`}
                onPress={() => setFormData({ ...formData, jenis_ibadah: 'wajib' })}
              >
                <ThemedText style={tw`text-center font-medium ${formData.jenis_ibadah === 'wajib'
                  ? 'text-white'
                  : 'text-gray-300'
                  }`}>
                  Wajib
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={tw`flex-1 p-3 rounded-r-lg ${formData.jenis_ibadah === 'sunah'
                  ? 'bg-green-600'
                  : 'bg-gray-600'
                  }`}
                onPress={() => setFormData({ ...formData, jenis_ibadah: 'sunah' })}
              >
                <ThemedText style={tw`text-center font-medium ${formData.jenis_ibadah === 'sunah'
                  ? 'text-white'
                  : 'text-gray-300'
                  }`}>
                  Sunah
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          <View style={tw`mb-5`}>
            <ThemedText style={tw`mb-1 font-medium`}>Tanggal Ibadah</ThemedText>

            {/* Date display and picker button */}
            <TouchableOpacity
              style={tw`bg-gray-700 p-3 rounded-lg border border-gray-600 flex-row justify-between items-center`}
              onPress={() => {
                // Set the selected date to match the current form data date
                if (formData.tanggal_ibadah) {
                  setSelectedDate(new Date(formData.tanggal_ibadah));
                }
                setShowDatePicker(true);
              }}
            >
              <ThemedText style={tw`text-white`}>
                {formData.tanggal_ibadah}
              </ThemedText>
              <ThemedText style={tw`text-blue-400`}>📅 Pilih Tanggal</ThemedText>
            </TouchableOpacity>
          </View>

          <View style={tw`flex-row gap-2`}>
            <TouchableOpacity
              style={tw`flex-1 bg-blue-600 p-3 rounded-lg ${loading ? 'opacity-70' : ''}`}
              onPress={handleSubmit}
              disabled={loading}
            >
              <View style={tw`flex-row justify-center items-center gap-2`}>
                {loading ? (
                  <>
                    <ActivityIndicator size="small" color="#ffffff" />

                  </>
                ) : (
                  <ThemedText style={tw`text-white text-center font-medium`}>
                    {editMode ? 'Update' : 'Simpan'}
                  </ThemedText>
                )}
              </View>
            </TouchableOpacity>

            {editMode && (
              <TouchableOpacity
                style={tw`flex-1 bg-gray-600 p-3 rounded-lg`}
                onPress={cancelEdit}
              >
                <ThemedText style={tw`text-gray-200 text-center font-medium`}>
                  Batal
                </ThemedText>
              </TouchableOpacity>
            )}
          </View>
        </ThemedView>
        {/* List Section */}
        <ThemedView style={tw`bg-gray-800 p-5 rounded-xl mb-6 shadow-white/5`}>
          <ThemedText type="subtitle" style={tw`mb-4`}>
            📋 Daftar Ibadah
          </ThemedText>

          {loading && !ibadahs.length ? (
            <View style={tw`py-8 items-center`}>
              <ActivityIndicator size="large" color="#A1CEDC" />
              <ThemedText style={tw`mt-2 text-gray-400`}>Loading...</ThemedText>
            </View>
          ) : error ? (
            <ThemedView style={tw`bg-red-900/30 p-4 rounded-lg border border-red-800`}>
              <ThemedText style={tw`text-red-300 text-center mb-2`}>{error}</ThemedText>
              <TouchableOpacity
                style={tw`bg-red-600 p-3 rounded-lg mt-2`}
                onPress={fetchIbadahs}
              >
                <ThemedText style={tw`text-white text-center font-medium`}>Coba Lagi</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          ) : ibadahs.length === 0 ? (
            <ThemedView style={tw`py-8 items-center bg-gray-700/50 rounded-lg`}>
              <ThemedText style={tw`text-gray-400 text-center`}>
                Belum ada data ibadah
              </ThemedText>
              <TouchableOpacity
                style={tw`bg-blue-600 p-2 px-4 rounded-lg mt-3`}
                onPress={fetchIbadahs}
              >
                <ThemedText style={tw`text-white text-center`}>Refresh</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          ) : (
            <View style={tw`flex-1`}>
              <ScrollView
                nestedScrollEnabled={true}
                style={tw`max-h-96`}
                showsVerticalScrollIndicator={false}
              >
                {ibadahs.map((ibadah) => (
                  <ThemedView
                    key={ibadah.id}
                    style={tw`mb-3 p-4 rounded-lg border ${ibadah.jenis_ibadah === 'wajib'
                      ? 'bg-blue-900/20 border-blue-800/30'
                      : 'bg-green-900/20 border-green-800/30'
                      }`}
                  >
                    <View style={tw`flex-row justify-between items-start`}>
                      <View style={tw`flex-1`}>
                        <ThemedText style={tw`font-bold text-lg ${ibadah.jenis_ibadah === 'wajib'
                          ? 'text-blue-300'
                          : 'text-green-300'
                          }`}>
                          {ibadah.nama_ibadah}
                        </ThemedText>

                        <View style={tw`flex-row items-center mt-1`}>
                          <View style={tw`rounded-full px-2 py-1 mr-2 ${ibadah.jenis_ibadah === 'wajib'
                            ? 'bg-blue-800/50'
                            : 'bg-green-800/50'
                            }`}>
                            <ThemedText style={tw`text-xs ${ibadah.jenis_ibadah === 'wajib'
                              ? 'text-blue-200'
                              : 'text-green-200'
                              }`}>
                              {ibadah.jenis_ibadah.toUpperCase()}
                            </ThemedText>
                          </View>
                          <ThemedText style={tw`text-sm text-gray-400`}>
                            {ibadah.tanggal_ibadah}
                          </ThemedText>
                        </View>
                      </View>

                      <View style={tw`flex-row`}>
                        <TouchableOpacity
                          style={tw`bg-yellow-600 p-2 rounded-lg mr-2`}
                          onPress={() => handleEdit(ibadah)}
                        >
                          <ThemedText style={tw`text-white font-medium`}>Edit</ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={tw`bg-red-600 p-2 rounded-lg`}
                          onPress={() => {
                            console.log('Delete button pressed for ID:', ibadah.id);
                            confirmDelete(ibadah.id);
                          }}
                        >
                          <ThemedText style={tw`text-white font-medium`}>Hapus</ThemedText>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </ThemedView>
                ))}
              </ScrollView>

              {/* Refresh button at the bottom of the list */}
              <TouchableOpacity
                style={tw`bg-gray-700 p-3 rounded-lg my-2 flex-row justify-center items-center`}
                onPress={handleRefresh}
                disabled={refreshing}
              >
                <ThemedText style={tw`text-gray-300 text-center mr-2`}>
                  {refreshing ? 'Memuat...' : 'Refresh Data'}
                </ThemedText>
                {refreshing && <ActivityIndicator size="small" color="#A1CEDC" />}
              </TouchableOpacity>

            </View>
          )}
        </ThemedView>

      </ScrollView>
      {/* Custom Web Delete Confirmation Modal */}
      {showDeleteModal && (
        <View style={tw`absolute inset-0 bg-black/50 flex items-center justify-center z-50`}>
          <View style={tw`bg-gray-800 p-5 rounded-xl w-80 shadow-lg`}>
            <ThemedText style={tw`text-lg font-bold mb-3`}>Konfirmasi</ThemedText>
            <ThemedText style={tw`mb-4`}>Apakah Anda yakin ingin menghapus ibadah ini?</ThemedText>

            <View style={tw`flex-row justify-end gap-3`}>
              <TouchableOpacity
                style={tw`bg-gray-600 p-2 px-4 rounded-lg`}
                onPress={() => {
                  setShowDeleteModal(false);
                  setPendingDeleteId(null);
                }}
              >
                <ThemedText style={tw`text-white`}>Batal</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={tw`bg-red-600 p-2 px-4 rounded-lg`}
                onPress={() => {
                  if (pendingDeleteId !== null) {
                    deleteIbadah(pendingDeleteId);
                  }
                  setShowDeleteModal(false);
                  setPendingDeleteId(null);
                }}
              >
                <ThemedText style={tw`text-white`}>Hapus</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}


      {/* Custom Web Date Picker Modal */}
      {showDatePicker && (
        <View style={tw`absolute inset-0 bg-black/50 flex items-center justify-center z-50`}>
          <View style={tw`bg-gray-800 p-5 rounded-xl w-80 shadow-lg`}>
            <View style={tw`flex-row justify-between items-center mb-4`}>
              <ThemedText style={tw`text-lg font-bold`}>Pilih Tanggal</ThemedText>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <ThemedText style={tw`text-gray-400 text-xl`}>✕</ThemedText>
              </TouchableOpacity>
            </View>

            {/* Simple Month/Year Selector */}
            <View style={tw`flex-row justify-between items-center mb-4`}>
              <TouchableOpacity
                style={tw`p-2`}
                onPress={() => {
                  const prevMonth = new Date(selectedDate);
                  prevMonth.setMonth(prevMonth.getMonth() - 1);
                  setSelectedDate(prevMonth);
                }}
              >
                <ThemedText style={tw`text-blue-400 text-xl`}>◀</ThemedText>
              </TouchableOpacity>

              <ThemedText style={tw`text-white font-bold`}>
                {selectedDate.toLocaleString('id-ID', { month: 'long', year: 'numeric' })}
              </ThemedText>

              <TouchableOpacity
                style={tw`p-2`}
                onPress={() => {
                  const nextMonth = new Date(selectedDate);
                  nextMonth.setMonth(nextMonth.getMonth() + 1);
                  setSelectedDate(nextMonth);
                }}
              >
                <ThemedText style={tw`text-blue-400 text-xl`}>▶</ThemedText>
              </TouchableOpacity>
            </View>

            {/* Day of Week Headers */}
            <View style={tw`flex-row justify-between mb-2`}>
              {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((day, index) => (
                <View key={index} style={tw`w-9 items-center`}>
                  <ThemedText style={tw`text-gray-400 font-medium`}>{day}</ThemedText>
                </View>
              ))}
            </View>

            {/* Calendar Grid */}
            <View style={tw`mb-4`}>
              {generateCalendarDays(selectedDate).map((week, weekIndex) => (
                <View key={weekIndex} style={tw`flex-row justify-between mb-2`}>
                  {week.map((day, dayIndex) => {
                    const isCurrentMonth = day.getMonth() === selectedDate.getMonth();
                    const isSelected =
                      day.getDate() === selectedDate.getDate() &&
                      day.getMonth() === selectedDate.getMonth() &&
                      day.getFullYear() === selectedDate.getFullYear();

                    return (
                      <TouchableOpacity
                        key={dayIndex}
                        style={tw`w-9 h-9 items-center justify-center rounded-full ${isSelected ? 'bg-blue-600' : isCurrentMonth ? '' : 'opacity-30'
                          }`}
                        onPress={() => {
                          const newDate = new Date(day);
                          newDate.setHours(0, 0, 0, 0);
                          setSelectedDate(newDate);
                        }}
                      >
                        <ThemedText style={tw`${isSelected ? 'text-white font-bold' : 'text-white'}`}>
                          {day.getDate()}
                        </ThemedText>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>

            {/* Action Buttons */}
            <View style={tw`flex-row justify-end gap-3`}>
              <TouchableOpacity
                style={tw`bg-gray-600 p-2 px-4 rounded-lg`}
                onPress={() => setShowDatePicker(false)}
              >
                <ThemedText style={tw`text-white`}>Batal</ThemedText>
              </TouchableOpacity>


              <TouchableOpacity
                style={tw`bg-blue-600 p-2 px-4 rounded-lg`}
                onPress={() => {
                  // Fix timezone issue by using local date formatting instead of ISO string
                  const year = selectedDate.getFullYear();
                  const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                  const day = String(selectedDate.getDate()).padStart(2, '0');
                  const formattedDate = `${year}-${month}-${day}`;

                  setFormData({ ...formData, tanggal_ibadah: formattedDate });
                  setShowDatePicker(false);
                }}
              >
                <ThemedText style={tw`text-white`}>Pilih</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}


