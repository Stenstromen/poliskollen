/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useEffect, useState} from 'react';
import type {PropsWithChildren} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  useWindowDimensions,
} from 'react-native';
import cheerio from 'react-native-cheerio';
import RenderHtml from 'react-native-render-html';
import MapView from 'react-native-maps';

type SectionProps = PropsWithChildren<{
  title: string;
}>;

function Section({children, title}: SectionProps): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const textStyle = {
    backgroundColor: isDarkMode ? '#E1E1E1' : '#FFFFFF',
    color: isDarkMode ? '#E1E1E1' : '#FFFFFF',
  };
  return (
    <View style={styles.sectionContainer}>
      <Text
        style={[
          styles.sectionTitle,
          {
            color: textStyle.color,
          },
        ]}>
        {title}
      </Text>
      <Text
        style={[
          styles.sectionDescription,
          {
            color: textStyle.color,
          },
        ]}>
        {children}
      </Text>
    </View>
  );
}

function App(): React.JSX.Element {
  const [html, setHtml] = useState('');
  const [data, setData] = useState<
    {
      id: number;
      datetime: string;
      name: string;
      summary: string;
      url: string;
      type: string;
      location: {
        name: string;
        gps: string;
      };
    }[]
  >([]);

  function getEvents(handelse: string) {
    fetch(`https://polisen.se/${handelse}`)
      .then(response => response.text())
      .then(htmlContent => {
        const $ = cheerio.load(htmlContent);

        const divContent = $('.text-body.editorial-html').html();

        console.log(divContent);
        setHtml(divContent);
      });
  }

  useEffect(() => {
    fetch('https://polisen.se/api/events').then(response => {
      response.json().then(res => {
        setData(res);
        console.log(res);
      });
    });
  }, []);
  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: isDarkMode ? '#E1E1E1' : '#FFFFFF',
  };

  const source = {
    html: html,
  };

  const {width} = useWindowDimensions();

  const [region, setRegion] = useState({
    latitude: 59.329324,
    longitude: 18.068581,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={backgroundStyle}>
        <View
          style={{
            backgroundColor: isDarkMode ? '#E1E1E1' : '#FFFFFF',
          }}>
          <MapView
            style={{height: 200}}
            initialRegion={region}
            region={region}
          />
          <RenderHtml contentWidth={width} source={source} />
          <Section title="Step One">
            {data.map(({id, name, url, location}) => (
              <View key={id}>
                <Text
                  onPress={() => {
                    getEvents(url);
                    setRegion({
                      latitude: parseFloat(location.gps.split(',')[0]),
                      longitude: parseFloat(location.gps.split(',')[1]),
                      latitudeDelta: 0.0922,
                      longitudeDelta: 0.0421,
                    });
                  }}>
                  {name}
                </Text>
              </View>
            ))}
          </Section>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
});

export default App;
