<template>
  <div class="relative h-full w-full">
    <div ref="mapContainer" class="h-full w-full"></div>

    <!-- Layer Toggle Button -->
    <div class="absolute top-4 left-4 z-10">
      <button
        @click="toggleFireLayer"
        class="px-4 py-2 bg-white shadow-md rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
        :class="{ 'bg-red-100': showFireLayer }"
      >
        {{ showFireLayer ? "Hide Fire Severity" : "Show Fire Severity" }}
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

const mapContainer = ref(null);
const map = shallowRef(null);
const marker = shallowRef(null);
const mapLoaded = ref(false);
const showFireLayer = ref(false);

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

// Add a hover effect for the fire severity layer
const addLayerInteractivity = () => {
  if (!map.value) return;

  // Change cursor to pointer when hovering over fire severity areas
  map.value.on("mouseenter", FIRE_LAYER_ID, () => {
    map.value.getCanvas().style.cursor = "pointer";
  });

  // Change cursor back when leaving fire severity areas
  map.value.on("mouseleave", FIRE_LAYER_ID, () => {
    map.value.getCanvas().style.cursor = "";
  });

  // Show popup on click with fire severity information
  map.value.on("click", FIRE_LAYER_ID, (e) => {
    if (e.features.length > 0) {
      const feature = e.features[0];
      const props = feature.properties;

      new mapboxgl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(
          `
            <h3 class="font-bold">Fire Hazard Severity Zone</h3>
            <p>Severity: ${props.FHSZ_Description || "Unknown"}</p>
            <p>Class: ${props.FHSZ_7Class || "Unknown"}</p>
            <p>Type: ${props.SRA22_2 || "Unknown"}</p>
          `
        )
        .addTo(map.value);
    }
  });
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
