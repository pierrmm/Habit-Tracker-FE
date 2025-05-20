import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, Linking, Modal, RefreshControl, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import tw from 'twrnc';

interface CatgirlResponse {
  success: boolean;
  status: number;
  id: string;
  image: {
    original: {
      url: string;
    };
    compressed: {
      url: string;
    };
  };
  tags: string[];
  rating: string;
  source: {
    url: string;
  };
  attribution: {
    artist: {
      username: string;
      profile: string;
    };
  };
}

export default function Neko() {
  const [catgirl, setCatgirl] = useState<CatgirlResponse | null>(null);
  const [catgirlGrid, setCatgirlGrid] = useState<CatgirlResponse[]>([]);
  const [hotCatgirls, setHotCatgirls] = useState<CatgirlResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [gridLoading, setGridLoading] = useState(false);
  const [hotLoading, setHotLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCatgirl, setSelectedCatgirl] = useState<CatgirlResponse | null>(null);
  const [showModal, setShowModal] = useState(false);

  const screenWidth = Dimensions.get('window').width;
  const imageSize = (screenWidth - 32 - 8) / 2; // 2 columns with padding and gap

  const getCatgirl = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('https://api.nekosia.cat/api/v1/images/catgirl/');
      console.log('Catgirl API response:', response.data);
      setCatgirl(response.data);
    } catch (err: any) {
      console.error('Error fetching catgirl:', err);
      setError(err.message || 'Failed to load catgirl image');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getCatgirlGrid = async () => {
    try {
      setGridLoading(true);
      const promises = Array(4).fill(null).map(() => 
        axios.get('https://api.nekosia.cat/api/v1/images/catgirl/')
      );
      
      const responses = await Promise.all(promises);
      const newCatgirls = responses.map(response => response.data);
      setCatgirlGrid(newCatgirls);
    } catch (err: any) {
      console.error('Error fetching catgirl grid:', err);
    } finally {
      setGridLoading(false);
    }
  };

  const getHotCatgirls = async () => {
    try {
      setHotLoading(true);
      // For demo purposes, we'll just fetch 3 more catgirls
      // In a real app, you might have an API endpoint for "hot" or "trending" content
      const promises = Array(3).fill(null).map(() => 
        axios.get('https://api.nekosia.cat/api/v1/images/catgirl/')
      );
      
      const responses = await Promise.all(promises);
      const hotImages = responses.map(response => response.data);
      setHotCatgirls(hotImages);
    } catch (err: any) {
      console.error('Error fetching hot catgirls:', err);
    } finally {
      setHotLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    getCatgirl();
    getCatgirlGrid();
    getHotCatgirls();
  };

  const openCatgirlDetails = (item: CatgirlResponse) => {
    setSelectedCatgirl(item);
    setShowModal(true);
  };

  useEffect(() => {
    getCatgirl();
    getCatgirlGrid();
    getHotCatgirls();
  }, []);

  return (
    <SafeAreaView style={tw`flex-1 mt-5 py-5`}>
    <ScrollView 
      style={tw`flex-1`}
      contentContainerStyle={tw`p-4`}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={['#A1CEDC']}
          tintColor="#A1CEDC"
        />
      }
    >
      {/* Featured Catgirl */}
      <ThemedView style={tw`mb-6 bg-black`}>
        <View style={tw`flex-row justify-between items-center mb-4`}>
          <ThemedText type="title">Featured Catgirl</ThemedText>
          <TouchableOpacity 
            onPress={getCatgirl}
            style={tw`bg-pink-600 p-2 rounded-lg flex-row items-center`}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Ionicons name="refresh" size={16} color="#ffffff" style={tw`mr-1`} />
                <ThemedText style={tw`text-white text-sm`}>New Catgirl</ThemedText>
              </>
            )}
          </TouchableOpacity>
        </View>
        
        {loading && !catgirl ? (
          <View style={tw`h-96 justify-center items-center bg-gray-800 rounded-xl`}>
            <ActivityIndicator size="large" color="#F472B6" />
            <ThemedText style={tw`mt-2 text-gray-400`}>Loading catgirl...</ThemedText>
          </View>
        ) : error ? (
          <ThemedView style={tw`py-8 items-center bg-gray-800 rounded-xl`}>
            <ThemedText style={tw`text-red-400 text-center mb-2`}>
              {error}
            </ThemedText>
            <TouchableOpacity
              style={tw`bg-pink-600 p-2 px-4 rounded-lg mt-3`}
              onPress={getCatgirl}
            >
              <ThemedText style={tw`text-white text-center`}>Try Again</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        ) : catgirl ? (
          <ThemedView style={tw`bg-gray-800 p-5 rounded-xl shadow-white/5`}>
            <Image 
              source={{uri: catgirl.image.compressed.url}} 
              style={tw`w-full h-96 rounded-lg mb-3`}
              resizeMode="cover"
            />
            
            <View style={tw`flex-row justify-between items-center mb-3`}>
              <ThemedText style={tw`text-lg font-bold text-pink-400`}>
                ID: {catgirl.id.substring(0, 8)}...
              </ThemedText>
              
              <TouchableOpacity
                style={tw`bg-pink-600/20 p-2 rounded-lg`}
                onPress={() => {
                  // Open original image in browser
                  Linking.openURL(catgirl.image.original.url);
                }}
              >
                <ThemedText style={tw`text-pink-400 text-sm`}>View Original</ThemedText>
              </TouchableOpacity>
            </View>
            
            <View style={tw`flex-row flex-wrap mb-4`}>
              {catgirl.tags && catgirl.tags.map((tag, index) => (
                <View key={index} style={tw`bg-gray-700 rounded-full px-3 py-1 mr-2 mb-2`}>
                  <Text style={tw`text-gray-300 text-xs`}>#{tag}</Text>
                </View>
              ))}
            </View>
            
            <View style={tw`border-t border-gray-700 pt-3`}>
              <ThemedText style={tw`text-gray-300 mb-2`}>
                Artist: {catgirl.attribution?.artist?.username || 'Unknown'}
              </ThemedText>
              
              <View style={tw`flex-row flex-wrap`}>
                {catgirl.source?.url && (
                  <TouchableOpacity 
                    onPress={() => Linking.openURL(catgirl.source.url)} 
                    style={tw`flex-row items-center mr-4 mb-2`}
                  >
                    <ThemedText style={tw`text-pink-400 mr-2`}>Source</ThemedText>
                    <Ionicons name="open-outline" size={20} color="#F472B6" />
                  </TouchableOpacity>
                )}
                
                {catgirl.attribution?.artist?.profile && (
                  <TouchableOpacity 
                    onPress={() => Linking.openURL(catgirl.attribution.artist.profile)} 
                    style={tw`flex-row items-center mb-2`}
                  >
                    <ThemedText style={tw`text-pink-400 mr-2`}>Artist Profile</ThemedText>
                    <Ionicons name="person-outline" size={20} color="#F472B6" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </ThemedView>
        ) : (
          <ThemedView style={tw`py-8 items-center bg-gray-800 rounded-xl`}>
            <ThemedText style={tw`text-gray-400 text-center`}>
              No catgirl image found
            </ThemedText>
            <TouchableOpacity
              style={tw`bg-pink-600 p-2 px-4 rounded-lg mt-3`}
              onPress={getCatgirl}
            >
              <ThemedText style={tw`text-white text-center`}>Load Catgirl</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        )}
      </ThemedView>
      
      {/* Hot Catgirls Section */}
      <ThemedView style={tw`mb-6 bg-black`}>
        <View style={tw`flex-row justify-between items-center mb-4`}>
          <ThemedText type="subtitle" style={tw`flex-row items-center`}>
            <Text style={tw`text-red-500 mr-1`}>🔥</Text> Catgirls
          </ThemedText>
          <TouchableOpacity 
            onPress={getHotCatgirls}
            style={tw`bg-red-600 p-2 rounded-lg flex-row items-center`}
            disabled={hotLoading}
          >
            {hotLoading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Ionicons name="refresh" size={16} color="#ffffff" style={tw`mr-1`} />
                <ThemedText style={tw`text-white text-sm`}>Refresh</ThemedText>
              </>
            )}
          </TouchableOpacity>
        </View>
        
                {hotLoading && hotCatgirls.length === 0 ? (
          <View style={tw`h-40 justify-center items-center bg-gray-800 rounded-xl`}>
            <ActivityIndicator size="large" color="#F472B6" />
            <ThemedText style={tw`mt-2 text-gray-400`}>Loading hot catgirls...</ThemedText>
          </View>
        ) : hotCatgirls.length > 0 ? (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={tw`mb-2`}
          >
            {hotCatgirls.map((item, index) => (
              <TouchableOpacity 
                key={item.id} 
                style={tw`mr-3 mb-2`}
                onPress={() => openCatgirlDetails(item)}
              >
                <View style={tw`relative`}>
                  <Image 
                    source={{uri: item.image.compressed.url}} 
                    style={tw`w-40 h-56 rounded-lg`}
                    resizeMode="cover"
                  />
                  <View style={tw`absolute top-2 right-2 bg-red-500 rounded-full p-1`}>
                    <Text style={tw`text-white text-xs font-bold`}>HOT</Text>
                  </View>
                </View>
                <ThemedText style={tw`mt-1 text-xs text-center text-gray-300`} numberOfLines={1}>
                  {item.attribution?.artist?.username || 'Unknown artist'}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <ThemedView style={tw`py-4 items-center bg-gray-800 rounded-xl`}>
            <ThemedText style={tw`text-gray-400 text-center`}>
              No hot catgirls found
            </ThemedText>
          </ThemedView>
        )}
      </ThemedView>

      {/* Catgirl Grid */}
      <ThemedView style={tw`mb-6 bg-black`}>
        <View style={tw`flex-row justify-between items-center mb-4`}>
          <ThemedText type="subtitle">Catgirl Collection</ThemedText>
          <TouchableOpacity 
            onPress={getCatgirlGrid}
            style={tw`bg-purple-600 p-2 rounded-lg flex-row items-center`}
            disabled={gridLoading}
          >
            {gridLoading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Ionicons name="refresh" size={16} color="#ffffff" style={tw`mr-1`} />
                <ThemedText style={tw`text-white text-sm`}>Refresh</ThemedText>
              </>
            )}
          </TouchableOpacity>
        </View>
        
        {gridLoading && catgirlGrid.length === 0 ? (
          <View style={tw`h-40 justify-center items-center bg-gray-800 rounded-xl`}>
            <ActivityIndicator size="large" color="#F472B6" />
            <ThemedText style={tw`mt-2 text-gray-400`}>Loading catgirl collection...</ThemedText>
          </View>
        ) : catgirlGrid.length > 0 ? (
          <View style={tw`flex-row flex-wrap justify-between`}>
            {catgirlGrid.map((item) => (
              <TouchableOpacity 
                key={item.id} 
                style={tw`mb-4`}
                onPress={() => openCatgirlDetails(item)}
              >
                <Image 
                  source={{uri: item.image.compressed.url}} 
                  style={{
                    width: imageSize,
                    height: imageSize * 1.4,
                    borderRadius: 8
                  }}
                  resizeMode="cover"
                />
                <View style={tw`absolute bottom-0 left-0 right-0 bg-black/50 p-2 rounded-b-lg`}>
                  <ThemedText style={tw`text-white text-xs text-center`} numberOfLines={1}>
                    {item.tags && item.tags.length > 0 ? `#${item.tags[0]}` : 'Catgirl'}
                  </ThemedText>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <ThemedView style={tw`py-4 items-center bg-gray-800 rounded-xl`}>
            <ThemedText style={tw`text-gray-400 text-center`}>
              No catgirl collection found
            </ThemedText>
          </ThemedView>
        )}
      </ThemedView>

      {/* Catgirl Detail Modal */}
      {showModal && selectedCatgirl && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={showModal}
          onRequestClose={() => setShowModal(false)}
        >
          <View style={tw`flex-1 justify-center items-center bg-black/80`}>
            <View style={tw`bg-gray-900 w-11/12 max-w-md rounded-xl p-4`}>
              <View style={tw`flex-row justify-between items-center mb-3`}>
                <ThemedText style={tw`text-lg font-bold text-pink-400`}>
                  Catgirl Details
                </ThemedText>
                <TouchableOpacity onPress={() => setShowModal(false)}>
                  <Ionicons name="close-circle" size={24} color="#F472B6" />
                </TouchableOpacity>
              </View>
              
              <Image 
                source={{uri: selectedCatgirl.image.compressed.url}} 
                style={tw`w-full h-80 rounded-lg mb-3`}
                resizeMode="contain"
              />
              
              <View style={tw`flex-row justify-between items-center mb-3`}>
                <ThemedText style={tw`text-sm text-gray-300`}>
                  ID: {selectedCatgirl.id.substring(0, 8)}...
                </ThemedText>
                
                <TouchableOpacity
                  style={tw`bg-pink-600 p-2 rounded-lg`}
                  onPress={() => {
                    Linking.openURL(selectedCatgirl.image.original.url);
                  }}
                >
                  <ThemedText style={tw`text-white text-sm`}>View Original</ThemedText>
                </TouchableOpacity>
              </View>
              
              <ScrollView style={tw`max-h-20 mb-3`}>
                <View style={tw`flex-row flex-wrap`}>
                  {selectedCatgirl.tags && selectedCatgirl.tags.map((tag, index) => (
                    <View key={index} style={tw`bg-gray-700 rounded-full px-3 py-1 mr-2 mb-2`}>
                      <Text style={tw`text-gray-300 text-xs`}>#{tag}</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
              
              <View style={tw`border-t border-gray-700 pt-3`}>
                <ThemedText style={tw`text-gray-300 mb-2`}>
                  Artist: {selectedCatgirl.attribution?.artist?.username || 'Unknown'}
                </ThemedText>
                
                <View style={tw`flex-row flex-wrap`}>
                  {selectedCatgirl.source?.url && (
                    <TouchableOpacity 
                      onPress={() => Linking.openURL(selectedCatgirl.source.url)} 
                      style={tw`flex-row items-center mr-4 mb-2`}
                    >
                      <ThemedText style={tw`text-pink-400 mr-2`}>Source</ThemedText>
                      <Ionicons name="open-outline" size={20} color="#F472B6" />
                    </TouchableOpacity>
                  )}
                  
                  {selectedCatgirl.attribution?.artist?.profile && (
                    <TouchableOpacity 
                      onPress={() => Linking.openURL(selectedCatgirl.attribution.artist.profile)} 
                      style={tw`flex-row items-center mb-2`}
                    >
                      <ThemedText style={tw`text-pink-400 mr-2`}>Artist Profile</ThemedText>
                      <Ionicons name="person-outline" size={20} color="#F472B6" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </ScrollView>
    </SafeAreaView>
  );
}