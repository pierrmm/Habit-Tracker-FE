import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { FlatList, Image, Linking, Text, TouchableOpacity, View } from 'react-native';
import tw from 'twrnc';

interface Article {
  url: string;
  urlToImage: string;
  title: string;
  description: string;
  author: string;
}

export default function Explore() {
  const [articles, setArticles] = useState<Article[]>([]);

  const getNews = async () => {
    try {
      const response = await axios.get('https://newsapi.org/v2/top-headlines?q=russia&apiKey=9536dead719b403589db467e78f903d5');
      setArticles(response.data.articles);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    getNews();
  }, []);
  return (
    <View>
      <Text>Halaman Berita</Text>
      <FlatList
        data={articles}
        keyExtractor={(item) => item.url}
        renderItem={({item}) => (
          <View style={tw`bg-gray-800 p-5 rounded-xl mb-6 shadow-white/5`}>
            <Image source={{uri: item.urlToImage}} style={tw`w-full h-40 rounded-lg mb-3`}/>
            <Text style={tw`text-xl font-bold mb-2 text-white`}>{item.title}</Text>
            <Text style={tw`text-gray-600 text-sm text-gray-300`}>{item.author}</Text>
            <Text style={tw`text-gray-600 text-sm text-gray-300`}>{item.description}</Text>
            <TouchableOpacity onPress={() => Linking.openURL(item.url)} style={tw`mt-2`}>
              <Ionicons name="open-outline" size={24} color="#3b82f6" />
            </TouchableOpacity>
          </View>
        )}
        style={tw`p-4`}
        ></FlatList>    
        </View>
  )
}