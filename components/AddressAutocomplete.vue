<template>
  <div class="relative w-full">
    <!-- Search Input -->
    <div class="flex items-center relative">
      <input
        ref="inputElement"
        type="text"
        v-model="searchText"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
        placeholder="Search for an address..."
        class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      />
      <button 
        v-if="searchText" 
        @click="clearSearch" 
        class="absolute right-2 text-gray-400 hover:text-gray-600"
        aria-label="Clear search"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>

    <!-- Results Dropdown -->
    <div 
      v-if="showResults && results.length > 0" 
      class="absolute z-50 mt-1 w-full bg-white shadow-lg rounded-md overflow-hidden border border-gray-200"
    >
      <ul>
        <li 
          v-for="(result, index) in results" 
          :key="index"
          @click="selectAddress(result)"
          class="px-4 py-2 hover:bg-gray-50 cursor-pointer"
        >
          <div class="font-medium">{{ result.place_name ? result.place_name.split(',')[0] : result.text || 'Unknown' }}</div>
          <div class="text-sm text-gray-500">{{ result.place_name || result.place_formatted || '' }}</div>
        </li>
      </ul>
    </div>
    
    <!-- No Results Message -->
    <div 
      v-if="showResults && searchText && results.length === 0 && !isLoading" 
      class="absolute z-50 mt-1 w-full bg-white shadow-lg rounded-md overflow-hidden border border-gray-200 p-4 text-center text-gray-500"
    >
      No results found
    </div>
    
    <!-- Loading indicator -->
    <div 
      v-if="isLoading" 
      class="absolute z-50 mt-1 w-full bg-white shadow-lg rounded-md overflow-hidden border border-gray-200 p-4 text-center"
    >
      <div class="flex justify-center">
        <div class="w-5 h-5 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onBeforeUnmount } from 'vue';
import { useRuntimeConfig } from 'nuxt/app';

const props = defineProps({
  access_token: {
    type: String,
    required: true
  },
  country: {
    type: String,
    default: 'us'
  },
  limit: {
    type: Number,
    default: 5
  }
});

const emit = defineEmits(['select-address', 'loading-state']);

const config = useRuntimeConfig();
const fireHazardApiUrl = (config.public.FIRE_HAZARD_API || 'https://fire-hazard-api-f7jb9.ondigitalocean.app').replace(/\/$/, '');
const zillowApiKey = config.public.ZILLOW_API_KEY;

const inputElement = ref(null);
const searchText = ref('');
const results = ref([]);
const showResults = ref(false);
const isLoading = ref(false);
let debounceTimeout = null;

// Function to perform manual geocoding search
const performSearch = async (query) => {
  if (!query || query.trim().length === 0) {
    results.value = [];
    showResults.value = false;
    isLoading.value = false;
    return;
  }
  
  isLoading.value = true;
  
  try {
    // Direct call to the Mapbox Geocoding API
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
      `access_token=${props.access_token}&` +
      `country=${props.country}&` +
      `limit=${props.limit}&` +
      `types=address,place,neighborhood,postcode,locality`
    );
    
    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }
    
    const data = await response.json();
    results.value = data.features || [];
    showResults.value = true;
  } catch (error) {
    console.error('Error in geocoding search:', error);
    results.value = [];
  } finally {
    isLoading.value = false;
  }
};

// Get fire hazard data for a location
const getFireHazardData = async (latitude, longitude) => {
  try {
    const response = await fetch(`${fireHazardApiUrl}/fire-hazard?lat=${latitude}&lon=${longitude}`);
    
    if (!response.ok) {
      throw new Error(`Fire API returned status ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching fire hazard data:`, error);
    return {
      error: true,
      message: error.message
    };
  }
};

// Get Zillow property data for an address
const getZillowData = async (address) => {
  try {
    const encodedAddress = encodeURIComponent(address);
    const response = await fetch(`https://zillow-com1.p.rapidapi.com/property?address=${encodedAddress}`, {
      headers: {
        'X-RapidAPI-Key': zillowApiKey,
        'X-RapidAPI-Host': 'zillow-com1.p.rapidapi.com'
      }
    });

    if (!response.ok) {
      throw new Error(`Zillow API returned status ${response.status}`);
    }

    const data = await response.json();
    
    // If we have a zpid, also fetch images
    if (data.zpid) {
      try {
        const imagesResponse = await fetch(`https://zillow-com1.p.rapidapi.com/images?zpid=${data.zpid}`, {
          headers: {
            'X-RapidAPI-Key': zillowApiKey,
            'X-RapidAPI-Host': 'zillow-com1.p.rapidapi.com'
          }
        });
        
        if (imagesResponse.ok) {
          const imagesData = await imagesResponse.json();
          if (imagesData.images && Array.isArray(imagesData.images)) {
            data.images = imagesData.images;
          }
        }
      } catch (imageError) {
        console.error('Error fetching Zillow images:', imageError);
      }
    }
    
    return data;
  } catch (error) {
    console.error(`Error fetching Zillow data:`, error);
    return {
      error: true,
      message: error.message
    };
  }
};

// Handle input with debounce
const handleInput = (e) => {
  // Clear any existing timeout
  if (debounceTimeout) {
    clearTimeout(debounceTimeout);
  }
  
  // Set a new timeout to delay the search
  debounceTimeout = setTimeout(() => {
    performSearch(searchText.value);
  }, 300); // 300ms debounce
};

// Select an address from the dropdown
const selectAddress = async (result) => {
  // Extract address components
  const coordinates = result.geometry?.coordinates || [0, 0];
  const [longitude, latitude] = coordinates;
  const fullAddress = result.place_name || '';
  
  // Emit loading state to parent
  emit('loading-state', true);
  
  // Parse context array for address components if available
  let place = '';
  let region = '';
  let postcode = '';
  let country = '';
  
  if (result.context) {
    result.context.forEach(ctx => {
      const id = ctx.id || '';
      if (id.startsWith('place')) place = ctx.text;
      if (id.startsWith('region')) region = ctx.text;
      if (id.startsWith('postcode')) postcode = ctx.text;
      if (id.startsWith('country')) country = ctx.text;
    });
  }
  
  // Create address components object
  const addressComponents = {
    fullAddress,
    coordinates, // [longitude, latitude]
    latitude,
    longitude,
    name: result.text || fullAddress.split(',')[0] || '',
    addressLine1: result.address || '',
    place,
    region,
    postcode,
    country,
    raw: result
  };

  // Update the input with the selected address
  searchText.value = fullAddress;
  
  // Close the dropdown
  showResults.value = false;
  
  // Get fire hazard data and Zillow data in parallel
  try {
    const [fireData, zillowData] = await Promise.all([
      getFireHazardData(latitude, longitude),
      getZillowData(fullAddress)
    ]);
    
    // Add fire hazard data to address components
    addressComponents.fireHazard = {
      inHazardZone: fireData.in_hazard_zone,
      hazardZone: fireData.hazard_zone,
      nearestHazardZone: fireData.nearest_hazard_zone,
      riskAssessment: fireData.risk_assessment,
      rawData: fireData
    };
    
    // Add Zillow data to address components
    addressComponents.zillow = {
      price: zillowData.price,
      bedrooms: zillowData.bedrooms,
      bathrooms: zillowData.bathrooms,
      livingArea: zillowData.livingArea,
      homeType: zillowData.homeType,
      yearBuilt: zillowData.yearBuilt,
      lotSize: zillowData.lotSize,
      zestimate: zillowData.zestimate,
      rentZestimate: zillowData.rentZestimate,
      taxAssessment: zillowData.taxAssessment,
      description: zillowData.description,
      images: zillowData.images || [],
      zpid: zillowData.zpid,
      rawData: zillowData
    };
  } catch (error) {
    console.error('Error processing property data:', error);
    // Add error placeholder
    addressComponents.error = true;
  } finally {
    // Emit loading state to parent
    emit('loading-state', false);
  }
  
  // Emit the selected address to the parent component
  emit('select-address', addressComponents);
};

const handleFocus = () => {
  if (searchText.value.trim()) {
    showResults.value = true;
  }
};

const handleBlur = () => {
  // Delay hiding results to allow for click events to register
  setTimeout(() => {
    showResults.value = false;
  }, 150);
};

const clearSearch = () => {
  searchText.value = '';
  results.value = [];
  showResults.value = false;
  inputElement.value?.focus();
};

// Cleanup on component unmount
onBeforeUnmount(() => {
  if (debounceTimeout) {
    clearTimeout(debounceTimeout);
  }
});

// Define methods that can be accessed from the parent component
defineExpose({
  clearSearch,
  focus: () => inputElement.value?.focus(),
  setAddress: (address) => {
    searchText.value = address;
  }
});
</script>