<template>
  <div class="relative h-full w-full">
    <div ref="mapContainer" class="h-full w-full"></div>
    
    <!-- Address Search Bar -->
    <div class="absolute top-4 left-4 right-4 lg:right-auto lg:w-96 z-10">
      <AddressAutocomplete 
        :access_token="accessToken"
        @select-address="handleAddressSelect"
        @loading-state="updateLoadingState"
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
    
    <!-- Reopen Sidebar Button - Only shown when sidebar is closed but we have property data -->
    <div
      v-if="showReopenButton"
      class="absolute right-4 z-10"
      style="top:5rem;"
    >
      <button
        @click="$emit('reopen-sidebar')"
        class="px-4 py-2 bg-white shadow-md rounded-md text-sm font-medium hover:bg-gray-50 transition-colors flex items-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V3zm3 0v14h9V3H6z" clip-rule="evenodd" />
        </svg>
        Show Details
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
import { useRuntimeConfig } from 'nuxt/app';

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
  sidebarOpen: {
    type: Boolean,
    default: false
  },
  selectedProperty: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['update-location', 'loading-state', 'reopen-sidebar']);

const config = useRuntimeConfig();
const fireHazardApiUrl = (config.public.FIRE_HAZARD_API || 'https://fire-hazard-api-f7jb9.ondigitalocean.app').replace(/\/$/, '');

const mapContainer = ref(null);
const map = shallowRef(null);
const marker = shallowRef(null);
const mapLoaded = ref(false);
const showFireLayer = ref(false);
const fireInfo = ref(null);
const isLoading = ref(false);

// Computed property to determine if the reopen button should be shown
const showReopenButton = computed(() => {
  return !props.sidebarOpen && props.selectedProperty !== null;
});

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
        
        // Get coordinates and fetch more data
        const [lng, lat] = e.lngLat.toArray();
        fetchFireHazardData(lat, lng);
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
  
  // If we have fire hazard data from the autocomplete component, show it in the map
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
  emit('update-location', addressData);
};

// Function to fetch fire hazard data from the API manually (for map click events)
const fetchFireHazardData = async (latitude, longitude) => {
  try {
    // Show loading state
    fireInfo.value = {
      ...fireInfo.value,
      isLoading: true
    };
    
    // Use the fire hazard API
    const response = await fetch(`${fireHazardApiUrl}/fire-hazard?lat=${latitude}&lon=${longitude}`);
    
    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }
    
    const data = await response.json();
    
    // Update fire info with API data
    fireInfo.value = {
      inHazardZone: data.in_hazard_zone,
      hazardZone: data.hazard_zone,
      nearestHazardZone: data.nearest_hazard_zone,
      riskAssessment: data.risk_assessment,
      isLoading: false
    };
    
  } catch (error) {
    console.error('Error fetching fire hazard data:', error);
    fireInfo.value = {
      isLoading: false,
      error: true,
      message: error.message
    };
  }
};

// Update loading state when autocomplete is loading (pass up to parent)
const updateLoadingState = (loading) => {
  isLoading.value = loading;
  emit('loading-state', loading);
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