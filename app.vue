<template>
  <div class="flex h-screen w-screen overflow-hidden">
    <!-- Map Area - Dynamic width based on sidebar state -->
    <div class="h-full relative bg-gray-300 transition-all duration-500 ease-in-out"
         :class="selectedProperty ? 'w-2/3' : 'w-full'">
      <MapDisplay
        v-if="propertyData && mapboxToken"
        :access-token="mapboxToken"
        :property="propertyData"
        @update-location="handleLocationUpdate"
        @loading-state="updateLoadingState"
      />
      <div v-else-if="pending" class="absolute inset-0 flex items-center justify-center bg-gray-200">
        <div class="flex flex-col items-center">
          <div class="w-12 h-12 border-4 border-gray-300 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
          <p>Loading Map...</p>
        </div>
      </div>
      <div v-else-if="error || !mapboxToken" class="absolute inset-0 flex items-center justify-center bg-red-100 text-red-700 p-4">
        <p v-if="!mapboxToken">Mapbox Token is missing. Please check configuration.</p>
        <p v-else>Error loading property data or map: {{ error?.message }}</p>
      </div>
      
     
    </div>
    
    <!-- Sidebar Area - Slides in when property selected -->
    <div 
      class="h-full transition-all duration-500 ease-in-out transform border-l border-gray-200 shadow-xl bg-white relative overflow-hidden"
      :class="[
        selectedProperty ? 'w-1/3 translate-x-0' : 'w-0 translate-x-full',
        sidebarLoading ? 'sidebar-shimmer' : ''
      ]"
    >
      <!-- Close button for sidebar -->
      <button 
        v-if="selectedProperty" 
        @click="closeSidebar"
        class="absolute top-3 left-3 z-10 bg-white rounded-full p-1 shadow-md hover:bg-gray-100 transition-colors"
        aria-label="Close sidebar"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      </button>
      
      <!-- Property Sidebar Content -->
      <PropertySidebar 
        v-if="selectedProperty"
        :property="selectedProperty" 
        :loading="sidebarLoading"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import MapDisplay from './components/MapDisplay.vue';
import PropertySidebar from './components/PropertySidebar.vue';

// Access Runtime Config for the Mapbox token
const config = useRuntimeConfig();
const mapboxToken = ref(config.public.MAPBOX_API_TOKEN);

// Initial property data for the map
const propertyData = ref(null);
const pending = ref(true);
const error = ref(null);
const initialLoad = ref(true);

// Sidebar state
const selectedProperty = ref(null);
const sidebarLoading = ref(false);

// Handle location update from map (address selection)
const handleLocationUpdate = (addressData) => {
  // Update selected property with the address data
  selectedProperty.value = addressData;
  initialLoad.value = false;
};

// Update loading state for the sidebar
const updateLoadingState = (loading) => {
  sidebarLoading.value = loading;
};

// Close sidebar function
const closeSidebar = () => {
  selectedProperty.value = null;
};

onMounted(async () => {
  if (!mapboxToken.value) {
    console.error("Mapbox API token is not configured in runtimeConfig.public.MAPBOX_API_TOKEN");
    pending.value = false;
    error.value = new Error("Mapbox token missing");
    return;
  }
  
  try {
    // Fetch initial property data to center the map
    const data = await $fetch('/property-data.json');
    propertyData.value = data;
  } catch (err) {
    console.error('Failed to fetch property data:', err);
    
    // Create a fallback property (San Francisco)
    propertyData.value = {
      propertyInfo: {
        latitude: 37.7749,
        longitude: -122.4194
      }
    };
    
    error.value = err;
  } finally {
    pending.value = false;
    initialLoad.value = false;
  }
});
</script>

<style>
/* Ensure body has no margin/padding */
body {
  margin: 0;
  padding: 0;
  overflow: hidden; /* Prevent scrollbars on body due to h-screen */
}

/* Shimmer loading effect for sidebar */
.sidebar-shimmer {
  position: relative;
  overflow: hidden;
}

.sidebar-shimmer::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.2) 50%,
    rgba(255, 255, 255, 0) 100%
  );
  z-index: 10;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}
</style>