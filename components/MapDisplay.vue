<template>
    <div class="relative h-full w-full">
      <div ref="mapContainer" class="h-full w-full"></div>
      
      <!-- Address Search Bar -->
      <div class="absolute top-4 left-4 right-4 lg:right-auto lg:w-96 z-10">
        <AddressAutocomplete 
          :access_token="accessToken"
          @select-address="handleAddressSelect"
        />
      </div>
      
      <!-- Layer Toggle Button -->
      <div class="absolute top-20 left-4 z-1">
        <button
          @click="toggleFireLayer"
          class="px-4 py-2 bg-white shadow-md rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
          :class="{ 'bg-red-100': showFireLayer }"
        >
          {{ showFireLayer ? "Hide Fire Severity" : "Show Fire Severity" }}
        </button>
      </div>
      
      <!-- Fire Severity Info Box (conditionally shown) -->
      <div v-if="fireInfo" class="absolute bottom-4 left-4 w-96 bg-white p-4 rounded-md shadow-lg z-10">
        <h3 class="font-bold text-lg mb-2">Fire Hazard Information</h3>
        
        <div v-if="fireInfo.isLoading" class="py-2">
          <p>Loading fire hazard data...</p>
        </div>
        
        <div v-else>
          <!-- In Hazard Zone status -->
          <div class="mb-2 py-1 px-2 rounded" :class="fireInfo.inHazardZone ? 'bg-red-50' : 'bg-green-50'">
            <p class="font-medium">
              {{ fireInfo.inHazardZone ? 'In Fire Hazard Zone' : 'Not in Fire Hazard Zone' }}
            </p>
          </div>
          
          <!-- Hazard Zone Information -->
          <div v-if="fireInfo.hazardZone" class="mb-2">
            <p class="font-medium">Severity: 
              <span :class="getSeverityClass(fireInfo.hazardZone.severity)">
                {{ fireInfo.hazardZone.severity }}
              </span>
            </p>
            <p class="text-sm">{{ fireInfo.hazardZone.explanation }}</p>
          </div>
          
          <!-- Nearest Hazard Zone -->
          <div v-if="fireInfo.nearestHazardZone && !fireInfo.inHazardZone" class="mb-2">
            <p class="font-medium">Nearest Hazard Zone: 
              <span :class="getSeverityClass(fireInfo.nearestHazardZone.severity)">
                {{ fireInfo.nearestHazardZone.severity }}
              </span>
              ({{ fireInfo.nearestHazardZone.distance_km.toFixed(1) }} km away)
            </p>
          </div>
          
          <!-- Risk Assessment -->
          <div v-if="fireInfo.riskAssessment" class="mb-2">
            <p class="font-medium">Risk Category: 
              <span :class="getSeverityClass(fireInfo.riskAssessment.category)">
                {{ fireInfo.riskAssessment.category }}
              </span>
            </p>
            <p class="text-sm">{{ fireInfo.riskAssessment.description }}</p>
          </div>
        </div>
        
        <button 
          @click="fireInfo = null" 
          class="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  </template>
  
  <script setup>
  import {
    ref,
    shallowRef,
    onMounted,
    onBeforeUnmount,
    watch,
    nextTick,
  } from "vue";
  import AddressAutocomplete from './AddressAutocomplete.vue';
  
  // Use NuxtApp to access plugins
  const nuxtApp = useNuxtApp();
  const mapboxgl = nuxtApp.mapboxgl;
  
  const props = defineProps({
    accessToken: {
      type: String,
      required: true,
    },
    property: {
      type: Object,
      required: true,
      validator: (prop) =>
        prop &&
        typeof prop.propertyInfo?.latitude === "number" &&
        typeof prop.propertyInfo?.longitude === "number",
    },
    initialZoom: {
      type: Number,
      default: 15,
    },
  });
  
  const emit = defineEmits(['update-location']);
  
  const mapContainer = ref(null);
  const map = shallowRef(null);
  const marker = shallowRef(null);
  const mapLoaded = ref(false);
  const showFireLayer = ref(false);
  const fireInfo = ref(null);
  
  // Fire severity layer constants
  const FIRE_SOURCE_ID = "fire-severity";
  const FIRE_LAYER_ID = "fire-severity";
  
  const initializeMap = () => {
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
        container: mapContainer.value,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [
          props.property.propertyInfo.longitude,
          props.property.propertyInfo.latitude,
        ],
        zoom: props.initialZoom,
        scrollZoom: true,
        cooperativeGestures: true,
      });
      map.value.on("load", () => {
        mapLoaded.value = true;
        console.log("Map loaded");
        addPropertyMarker();
        map.value.addControl(new mapboxgl.NavigationControl(), "top-right");
        // Add fire severity source and layer (initially hidden)
        addFireSeverityLayer();
      });
      map.value.on("error", (e) => {
        console.error("Mapbox error:", e);
      });
    } catch (error) {
      console.error("Error initializing Mapbox map:", error);
    }
  };
  
  const addPropertyMarker = () => {
    if (!map.value || !mapLoaded.value || !props.property?.propertyInfo) return;
    if (marker.value) {
      marker.value.remove();
    }
    marker.value = new mapboxgl.Marker({ color: "#FF0000" })
      .setLngLat([
        props.property.propertyInfo.longitude,
        props.property.propertyInfo.latitude,
      ])
      .addTo(map.value);
  };
  
  const addFireSeverityLayer = () => {
    if (!map.value || !mapLoaded.value) return;
    // Add the fire severity source if it doesn't exist
    if (!map.value.getSource(FIRE_SOURCE_ID)) {
      map.value.addSource(FIRE_SOURCE_ID, {
        type: "vector",
        url: "mapbox://martoast.ca-fire-severity",
      });
    }
    // Add the fire severity layer if it doesn't exist
    if (!map.value.getLayer(FIRE_LAYER_ID)) {
      map.value.addLayer({
        id: FIRE_LAYER_ID,
        type: "fill",
        source: FIRE_SOURCE_ID,
        "source-layer": "fire_severity",
        layout: {
          visibility: "none", // Initially hidden
        },
        paint: {
          "fill-color": [
            "match",
            ["get", "FHSZ_Description"],
            "Moderate", "#FFEB3B", // Yellow for moderate
            "High", "#FF9800",     // Orange for high
            "Very High", "#F44336", // Red for very high
            "#BBDEFB",             // Default light blue for any other values
          ],
          "fill-opacity": 0.7,
          "fill-outline-color": "#000000",
        },
      });
      
      // Add hover effect for better user interaction
      map.value.on('mouseenter', FIRE_LAYER_ID, () => {
        map.value.getCanvas().style.cursor = 'pointer';
      });
      
      map.value.on('mouseleave', FIRE_LAYER_ID, () => {
        map.value.getCanvas().style.cursor = '';
      });
      
      // Add click handler for fire severity layer
      map.value.on('click', FIRE_LAYER_ID, (e) => {
        if (e.features.length > 0) {
          const feature = e.features[0];
          const props = feature.properties;
          
          // Set fire info for the info box
          fireInfo.value = {
            hazardZone: {
              severity: props.FHSZ_Description || "Unknown",
              explanation: `This area is classified as ${props.FHSZ_Description} fire hazard severity. Type: ${props.SRA22_2 || "Unknown"}`
            },
            inHazardZone: true,
            mapLayerData: props
          };
        }
      });
    }
  };
  
  const toggleFireLayer = () => {
    if (!map.value || !mapLoaded.value) return;
    showFireLayer.value = !showFireLayer.value;
    if (map.value.getLayer(FIRE_LAYER_ID)) {
      const visibility = showFireLayer.value ? "visible" : "none";
      // Correct way to set layout property
      map.value.setLayoutProperty(FIRE_LAYER_ID, "visibility", visibility);
    } else {
      console.warn("Fire severity layer not found");
      // Try adding it if it doesn't exist
      addFireSeverityLayer();
      if (showFireLayer.value) {
        map.value.setLayoutProperty(FIRE_LAYER_ID, "visibility", "visible");
      }
    }
  };
  
  // Function to handle address selection from the autocomplete
  const handleAddressSelect = (addressData) => {
    if (!map.value || !addressData.coordinates) return;
    
    // Extract coordinates
    const longitude = addressData.longitude;
    const latitude = addressData.latitude;
    
    // Fly to the selected location
    map.value.flyTo({
      center: [longitude, latitude],
      zoom: props.initialZoom,
      essential: true
    });
    
    // Update marker
    if (marker.value) marker.value.remove();
    marker.value = new mapboxgl.Marker({ color: "#FF0000" })
      .setLngLat([longitude, latitude])
      .addTo(map.value);
    
    // If we have fire hazard data from the autocomplete component, show it
    if (addressData.fireHazard) {
      fireInfo.value = addressData.fireHazard;
    }
    
    // Show fire layer if not already visible
    if (!showFireLayer.value) {
      showFireLayer.value = true;
      if (map.value.getLayer(FIRE_LAYER_ID)) {
        map.value.setLayoutProperty(FIRE_LAYER_ID, "visibility", "visible");
      }
    }
    
    // Emit updated location to parent component
    emit('update-location', {
      latitude,
      longitude,
      address: addressData.fullAddress,
      addressComponents: addressData
    });
  };
  
  // Helper function to get CSS class based on severity
  const getSeverityClass = (severity) => {
    if (!severity) return '';
    
    const severityLower = severity.toLowerCase();
    if (severityLower.includes('very high')) return 'text-red-600 font-bold';
    if (severityLower.includes('high')) return 'text-orange-600 font-bold';
    if (severityLower.includes('moderate')) return 'text-yellow-600 font-bold';
    if (severityLower.includes('low')) return 'text-green-600';
    return 'text-blue-600';
  };
  
  watch(
    () => props.property,
    (newProperty) => {
      if (map.value && mapLoaded.value && newProperty?.propertyInfo) {
        const newCoords = [
          newProperty.propertyInfo.longitude,
          newProperty.propertyInfo.latitude,
        ];
        map.value.flyTo({
          center: newCoords,
          zoom: props.initialZoom,
          essential: true,
        });
        addPropertyMarker();
      } else if (map.value && !newProperty?.propertyInfo) {
        if (marker.value) {
          marker.value.remove();
          marker.value = null;
        }
      }
    },
    { deep: true }
  );
  
  // Watch for changes to showFireLayer to add interactivity when layer becomes visible
  watch(
    () => showFireLayer.value,
    (isVisible) => {
      if (isVisible && map.value) {
        // Add a small delay to ensure the layer is fully visible
        setTimeout(() => {
          addLayerInteractivity();
        }, 100);
      }
    }
  );
  
  // Add layer interactivity
  const addLayerInteractivity = () => {
    if (!map.value) return;
    
    // These should be registered once only
    if (!map.value._fireInteractivityAdded) {
      // Change cursor to pointer when hovering over fire severity areas
      map.value.on("mouseenter", FIRE_LAYER_ID, () => {
        map.value.getCanvas().style.cursor = "pointer";
      });
      
      // Change cursor back when leaving fire severity areas
      map.value.on("mouseleave", FIRE_LAYER_ID, () => {
        map.value.getCanvas().style.cursor = "";
      });
      
      map.value._fireInteractivityAdded = true;
    }
  };
  
  onMounted(() => {
    if (process.client) {
      nextTick(() => {
        if (mapContainer.value && props.property?.propertyInfo) {
          initializeMap();
        } else {
          if (!mapContainer.value)
            console.warn(
              "MapDisplay: mapContainer ref not ready on mount/nextTick."
            );
          if (!props.property?.propertyInfo)
            console.warn(
              "MapDisplay: Property data with coordinates not available on mount/nextTick."
            );
        }
      });
    }
  });
  
  onBeforeUnmount(() => {
    if (map.value) {
      try {
        map.value.remove();
      } catch (e) {
        console.error("Error removing map:", e);
      }
      map.value = null;
      mapLoaded.value = false;
      marker.value = null;
    }
  });
  </script>
  
  <style>
  @import "mapbox-gl/dist/mapbox-gl.css";
  .mapboxgl-popup-content {
    font-family: sans-serif;
    padding: 10px;
    max-width: 300px;
  }
  </style>