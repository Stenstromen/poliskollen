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
  Animated,
} from 'react-native';
import cheerio from 'cheerio';
import RenderHtml from 'react-native-render-html';
import MapView from 'react-native-maps';
import MultiSelect from 'react-native-multiple-select';
import DateTimePicker from '@react-native-community/datetimepicker';

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

const locations = [
  {id: 'Stockholm', name: 'Stockholm'},
  {id: 'Göteborg', name: 'Göteborg'},
  {id: 'Malmö', name: 'Malmö'},
];

const eventTypes = [
  {id: 'Brand', name: 'Brand'},
  {id: 'Inbrott', name: 'Inbrott'},
  {id: 'Detonation', name: 'Detonation'},
];

function FilterComponent({
  showDatePicker,
  setShowDatePicker,
  dateTimeFilter,
  setDateTimeFilter,
  locationFilter,
  setLocationFilter,
  typeFilter,
  setTypeFilter,
}: {
  showDatePicker: boolean;
  setShowDatePicker: (showDatePicker: boolean) => void;
  dateTimeFilter: string;
  setDateTimeFilter: (dateTimeFilter: string) => void;
  locationFilter: string;
  setLocationFilter: (locationFilter: string) => void;
  typeFilter: string;
  setTypeFilter: (typeFilter: string) => void;
}): JSX.Element {
  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setDateTimeFilter(selectedDate.toISOString().split('T')[0]);
      console.log(selectedDate.toISOString());
    }
  };

  return (
    <View style={styles.container}>
      <Text>Filter Events</Text>
      {showDatePicker ? (
        <>
          <DateTimePicker
            testID="dateTimePicker"
            value={dateTimeFilter ? new Date(dateTimeFilter) : new Date()}
            mode="date"
            display="default"
            onChange={handleDateChange}
            timeZoneName={'Europe/Stockholm'}
            maximumDate={new Date()}
          />
          <Button
            title="Dölj datumväljare"
            onPress={() => setShowDatePicker(false)}
          />
        </>
      ) : (
        <Button
          title="Välj datum"
          onPress={() => {
            setDateTimeFilter('');
            setShowDatePicker(true);
          }}
        />
      )}

      <MultiSelect
        hideTags
        items={locations}
        uniqueKey="id"
        onSelectedItemsChange={selectedItems =>
          setLocationFilter(selectedItems.join(';'))
        }
        selectedItems={locationFilter.split(';')}
        selectText="Pick Locations"
        searchInputPlaceholderText="Search Locations..."
        onChangeInput={text => console.log(text)}
        altFontFamily="ProximaNova-Light"
        tagRemoveIconColor="#000"
        tagBorderColor="#000"
        tagTextColor="#000"
        selectedItemTextColor="#000"
        selectedItemIconColor="#000"
        itemTextColor="#CCC"
        displayKey="name"
        searchInputStyle={{color: '#000'}}
        submitButtonColor="#000"
        submitButtonText="Submit"
      />

      <MultiSelect
        hideTags
        items={eventTypes}
        uniqueKey="id"
        onSelectedItemsChange={selectedItems =>
          setTypeFilter(selectedItems.join(';'))
        }
        selectedItems={typeFilter.split(';')}
        selectText="Pick Event Types"
        searchInputPlaceholderText="Search Event Types..."
        onChangeInput={text => console.log(text)}
        altFontFamily="ProximaNova-Light"
        tagRemoveIconColor="#000"
        tagBorderColor="#000"
        tagTextColor="#000"
        selectedItemTextColor="#000"
        selectedItemIconColor="#000"
        itemTextColor="#CCC"
        displayKey="name"
        searchInputStyle={{color: '#000'}}
        submitButtonColor="#000"
        submitButtonText="Submit"
      />
    </View>
  );
}

function getEvents(
  handelse: string,
  callback: (content: {preamble: string; divContent: string}) => void,
): void {
  fetch(`https://polisen.se/${handelse}`)
    .then(response => response.text())
    .then(htmlContent => {
      const $: cheerio.Root = cheerio.load(htmlContent);
      const preamble = $('.preamble').html() || '';
      const divContent = $('.text-body.editorial-html').html() || '';

      callback({preamble, divContent});
    })
    .catch((error: unknown) => {
      console.error('Error fetching events:', error);
      if (error instanceof Error) {
        console.log(error.message);
      }
      callback({preamble: '', divContent: ''});
    });
}

function EventItem({
  children,
  id,
  title,
  header,
  url,
}: EventItemProps): JSX.Element {
  const [expanded, setExpanded] = useState(false);
  const animationHeight = new Animated.Value(0);

  const [htmlContent, setHtmlContent] = useState<string>('');
  const [title2, setTitle2] = useState<string>('');
  const {width} = useWindowDimensions();

  const toggleItem = () => {
    setExpanded(!expanded);

    if (!expanded) {
      Animated.timing(animationHeight, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();

      getEvents(url, ({preamble, divContent}) => {
        setHtmlContent(divContent);
        setTitle2(preamble);
      });
    } else {
      Animated.timing(animationHeight, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  };

  const body = (
    <Animated.View style={[styles.accordBody]}>
      {children}
      <View style={styles.accordBody}>
        <Text style={styles.textSmall}>{header}</Text>
        <View style={styles.seperator} />
        {htmlContent ? (
          <>
            <RenderHtml
              contentWidth={width}
              source={{html: `<h3><strong>${title2}</strong></h3>`}}
            />
            <RenderHtml contentWidth={width} source={{html: htmlContent}} />
          </>
        ) : (
          <Text style={styles.textSmall}>Loading...t</Text>
        )}
        <Button title="Stäng" onPress={toggleItem} />
      </View>
    </Animated.View>
  );

  return (
    <View key={id} style={styles.accordContainer}>
      <TouchableOpacity style={styles.accordHeader} onPress={toggleItem}>
        <Text style={styles.accordTitle}>{title.split(',')[1]}</Text>
        <Text>{title.split(',').pop() + ', ' + title.split(',')[0]}</Text>
      </TouchableOpacity>
      {expanded && body}
    </View>
  );
}

function App(): React.JSX.Element {
  const [data, setData] = useState<ApiResult[]>([]);
  const [showFilter, setShowFilter] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateTimeFilter, setDateTimeFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

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
    console.log(url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateTimeFilter, locationFilter, typeFilter, showDatePicker]);
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
        {showFilter ? (
          <View style={styles.filterContainer}>
            <FilterComponent
              showDatePicker={showDatePicker}
              setShowDatePicker={setShowDatePicker}
              dateTimeFilter={dateTimeFilter}
              setDateTimeFilter={setDateTimeFilter}
              locationFilter={locationFilter}
              setLocationFilter={setLocationFilter}
              typeFilter={typeFilter}
              setTypeFilter={setTypeFilter}
            />
            <Button title="Göm Filter" onPress={() => setShowFilter(false)} />
          </View>
        ) : (
          <View style={styles.filterContainer}>
            <Button title="Visa Filter" onPress={() => setShowFilter(true)} />
          </View>
        )}
        <View
          style={{
            backgroundColor: isDarkMode ? '#E1E1E1' : '#FFFFFF',
          }}>
          {data.map(({id, name, url, location}) => (
            <>
              <EventItem
                key={id}
                id={id}
                //title={name.split(',')[1]}
                title={name}
                header={name}
                url={url}>
                <MapView
                  style={{height: 150}}
                  scrollEnabled={false}
                  zoomEnabled={false}
                  rotateEnabled={false}
                  pitchEnabled={false}
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
  filterContainer: {
    padding: 10,
    backgroundColor: '#f0f0f0',
  },
  input: {
    height: 40,
    marginBottom: 10,
    borderWidth: 1,
    padding: 10,
  },
  container: {
    padding: 20,
  },
});

export default App;
