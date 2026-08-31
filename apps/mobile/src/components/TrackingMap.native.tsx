import { StyleSheet, View } from 'react-native'
import MapView, { Marker } from 'react-native-maps'
import { radius } from '../lib/theme'

export function TrackingMap({ lat, lng }: { lat: number; lng: number }) {
  return (
    <View style={styles.wrap}>
      <MapView
        style={styles.map}
        initialRegion={{ latitude: lat, longitude: lng, latitudeDelta: 0.02, longitudeDelta: 0.02 }}
        region={{ latitude: lat, longitude: lng, latitudeDelta: 0.02, longitudeDelta: 0.02 }}
      >
        <Marker coordinate={{ latitude: lat, longitude: lng }} title="المندوب" description="موقع المندوب الحالي" />
      </MapView>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { height: 220, borderRadius: radius.lg, overflow: 'hidden' },
  map: { flex: 1 },
})
