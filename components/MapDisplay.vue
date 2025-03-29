<template>
    <div ref="mapContainer" class="h-full w-full"></div>
  </template>
  
  <script setup>
  // --- IMPORT nextTick from vue ---
  import { ref, shallowRef, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
  
  // Use NuxtApp to access plugins
  const nuxtApp = useNuxtApp();
  const mapboxgl = nuxtApp.mapboxgl;
  
  const props = defineProps({
    accessToken: {
      type: String,
      required: true,
    },
    property: {
      type: Object, // Keep type as Object
      required: true,
      validator: (prop) =>
        prop &&
        typeof prop.propertyInfo?.latitude === 'number' &&
        typeof prop.propertyInfo?.longitude === 'number',
    },
    initialZoom: {
      type: Number,
      default: 15,
    },
  });
  
  const mapContainer = ref(null);
  const map = shallowRef(null);
  const marker = shallowRef(null);
  const mapLoaded = ref(false);
  
  const initializeMap = () => {
    // ... (rest of initializeMap function remains the same)
    if (!mapboxgl || !mapContainer.value || !props.property?.propertyInfo) {
        console.warn("Map initialization prerequisites not met.");
        return;
    }
  
    try {
      mapboxgl.accessToken = props.accessToken;
  
      if (map.value) {
        map.value.remove();
        map.value = null;
      }
  
      map.value = new mapboxgl.Map({
        container: mapContainer.value, // Use the ref's value
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [props.property.propertyInfo.longitude, props.property.propertyInfo.latitude],
        zoom: props.initialZoom,
        scrollZoom: true,
        cooperativeGestures: true,
      });
  
      map.value.on('load', () => {
        mapLoaded.value = true;
        console.log('Map loaded');
        addPropertyMarker();
        map.value.addControl(new mapboxgl.NavigationControl(), 'top-right');
      });
  
      map.value.on('error', (e) => {
        console.error('Mapbox error:', e);
      });
  
    } catch (error) {
      console.error('Error initializing Mapbox map:', error);
    }
  };
  
  const addPropertyMarker = () => {
     // ... (addPropertyMarker function remains the same)
     if (!map.value || !mapLoaded.value || !props.property?.propertyInfo) return;
  
      if (marker.value) {
        marker.value.remove();
      }
  
      marker.value = new mapboxgl.Marker({ color: '#FF0000' })
        .setLngLat([props.property.propertyInfo.longitude, props.property.propertyInfo.latitude])
        .addTo(map.value);
  };
  
  // ... (watchers remain the same)
   watch(
        () => props.property,
        (newProperty) => {
          if (map.value && mapLoaded.value && newProperty?.propertyInfo) { // Check mapLoaded too
            const newCoords = [newProperty.propertyInfo.longitude, newProperty.propertyInfo.latitude];
            map.value.flyTo({
              center: newCoords,
              zoom: props.initialZoom,
              essential: true,
            });
            addPropertyMarker();
          } else if (map.value && !newProperty?.propertyInfo) {
              // Handle case where property becomes invalid/null - maybe clear marker?
              if (marker.value) {
                  marker.value.remove();
                  marker.value = null;
              }
          }
        },
        { deep: true }
      );
  
  
  onMounted(() => {
    if (process.client) {
      // --- USE imported nextTick ---
      nextTick(() => {
        // Ensure the container element is available AND property data is valid
        if (mapContainer.value && props.property?.propertyInfo) {
           initializeMap();
        } else {
           if (!mapContainer.value) console.warn("MapDisplay: mapContainer ref not ready on mount/nextTick.");
           if (!props.property?.propertyInfo) console.warn("MapDisplay: Property data with coordinates not available on mount/nextTick.");
        }
      });
    }
  });
  
  onBeforeUnmount(() => {
    // ... (onBeforeUnmount remains the same)
    if (map.value) {
      try {
        map.value.remove();
      } catch (e) {
          console.error("Error removing map:", e)
      }
      map.value = null;
      mapLoaded.value = false; // Reset loaded state
      marker.value = null; // Clear marker ref
    }
  });
  
  </script>
  
  <style>
  @import 'mapbox-gl/dist/mapbox-gl.css';
  
  /* Optional: Style the marker or popup if needed */
  .mapboxgl-popup-content {
    font-family: sans-serif;
    padding: 10px;
  }
  </style>