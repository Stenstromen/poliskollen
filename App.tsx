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
  TouchableOpacity,
  Button,
} from 'react-native';
import cheerio from 'react-native-cheerio';
import RenderHtml from 'react-native-render-html';
import MapView from 'react-native-maps';

interface ApiResult {
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
}

type EventItemProps = PropsWithChildren<{
  id: number;
  title: string;
  header: string;
  isExpanded?: (expanded: boolean) => void;
  url: string;
  onPress?: () => void;
}>;

function getEvents(
  handelse: string,
  callback: (content: {preamble: string; divContent: string}) => void,
): void {
  fetch(`https://polisen.se/${handelse}`)
    .then(response => response.text())
    .then(htmlContent => {
      const $ = cheerio.load(htmlContent);
      const preamble = $('.preamble').html() || ''; // Extract preamble
      const divContent = $('.text-body.editorial-html').html() || ''; // Extract div content

      callback({preamble, divContent}); // Pass an object with both contents to the callback
    })
    .catch(error => {
      console.error('Error fetching events:', error);
      callback({preamble: '', divContent: ''}); // Handle errors
    });
}

function EventItem({
  children,
  id,
  title,
  header,
  url,
}: EventItemProps): JSX.Element {
  const [expanded, setExpanded] = useState<Boolean>(false);
  const [htmlContent, setHtmlContent] = useState<any>('');
  const [title2, setTitle2] = useState<string>('');
  const {width} = useWindowDimensions();

  function toggleItem() {
    setExpanded(!expanded);

    if (!expanded) {
      getEvents(url, ({preamble, divContent}) => {
        setHtmlContent(divContent);
        setTitle2(preamble);
      });
    }
  }

  const body = (
    <View style={styles.accordBody}>
      {children}
      <View style={styles.seperator} />
      <Text style={styles.textSmall}>{header}</Text>
      <View style={styles.seperator} />
      {htmlContent ? (
        <>
          <RenderHtml
            contentWidth={width}
            source={{html: `<strong>${title2}</strong><br/>`}}
          />
          <RenderHtml contentWidth={width} source={{html: htmlContent}} />
        </>
      ) : (
        <Text style={styles.textSmall}>Loading...t</Text>
      )}
      <Button title="Close" onPress={toggleItem} />
    </View>
  );

  return (
    <View key={id} style={styles.accordContainer}>
      <TouchableOpacity style={styles.accordHeader} onPress={toggleItem}>
        <Text style={styles.accordTitle}>{title}</Text>
        <Text>ICON HERE</Text>
      </TouchableOpacity>
      {expanded && body}
    </View>
  );
}

function App(): React.JSX.Element {
  const [data, setData] = useState<ApiResult[]>([]);
  const [dateTimeFilter, setDateTimeFilter] = useState('2024-01');
  const [locationFilter, setLocationFilter] = useState('Stockholm');
  const [typeFilter, setTypeFilter] = useState('Inbrott');

  const constructApiUrl = () => {
    let url = 'https://polisen.se/api/events';
    const params = [];

    if (dateTimeFilter) {
      params.push(`DateTime=${encodeURIComponent(dateTimeFilter)}`);
    }
    if (locationFilter) {
      params.push(`locationname=${encodeURIComponent(locationFilter)}`);
    }
    if (typeFilter) {
      params.push(`type=${encodeURIComponent(typeFilter)}`);
    }

    if (params.length) {
      url += '?' + params.join('&');
    }
    return url;
  };

  useEffect(() => {
    const url = constructApiUrl();
    fetch(url)
      .then(response => response.json())
      .then(setData)
      .catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateTimeFilter, locationFilter, typeFilter]);
  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: isDarkMode ? '#E1E1E1' : '#FFFFFF',
  };

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
          {data.map(({id, name, url, location}) => (
            <>
              <EventItem
                id={id}
                title={name.split(',')[1]}
                header={name}
                url={url}>
                <MapView
                  style={{height: 200}}
                  region={{
                    latitude: parseFloat(location.gps.split(',')[0]),
                    longitude: parseFloat(location.gps.split(',')[1]),
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                  }}
                />
              </EventItem>
            </>
          ))}
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
  accordContainer: {
    paddingBottom: 4,
  },
  accordHeader: {
    padding: 12,
    backgroundColor: '#666',
    color: '#eee',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  accordTitle: {
    fontSize: 20,
  },
  accordBody: {
    padding: 12,
  },
  textSmall: {
    fontSize: 16,
  },
  seperator: {
    height: 12,
  },
});

export default App;
