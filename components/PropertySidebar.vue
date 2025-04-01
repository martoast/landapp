<template>
  <div class="h-full overflow-y-auto bg-white">
    <!-- Loading state -->
    <div v-if="loading" class="h-full flex flex-col items-center justify-center p-6">
      <div class="w-12 h-12 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
      <p class="text-gray-600">Analyzing property data...</p>
    </div>
    
    <!-- Property data loaded state -->
    <div v-else-if="property" class="p-6 space-y-6">
      <!-- Image Slideshow -->
      <div v-if="hasImages" class="relative rounded-lg overflow-hidden shadow-md">
        <div class="w-full h-56 relative">
          <img 
            :src="currentImage" 
            alt="Property image" 
            class="w-full h-full object-cover"
          />
          
          <!-- Carousel Navigation -->
          <div v-if="imagesCount > 1" class="absolute inset-x-0 bottom-0 flex justify-between p-2">
            <button 
              @click="prevImage" 
              class="bg-black/40 hover:bg-black/60 text-white rounded-full p-1 transition-colors"
              aria-label="Previous image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
            </button>
            <div class="bg-black/40 text-white px-2 py-1 rounded-full text-xs">
              {{ currentImageIndex + 1 }} / {{ imagesCount }}
            </div>
            <button 
              @click="nextImage" 
              class="bg-black/40 hover:bg-black/60 text-white rounded-full p-1 transition-colors"
              aria-label="Next image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      <div v-else class="w-full h-40 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500">
        No Images Available
      </div>
      
      <!-- Address & Price -->
      <div>
        <div class="flex justify-between items-start">
          <div>
            <h2 class="text-xl font-bold text-gray-900">{{ formatPrice(property.price || property.zillow?.price) }}</h2>
            <p class="text-sm text-gray-600 mt-1">{{ getFullAddress() }}</p>
          </div>
          <div class="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-xs font-semibold">
            {{ property.homeType || property.zillow?.homeType || 'LAND' }}
          </div>
        </div>
        
        <!-- APN/Parcel Number -->
        <div v-if="property.resoFacts?.parcelNumber" class="mt-1 text-xs text-gray-500">
          APN: {{ property.resoFacts.parcelNumber }}
        </div>
      </div>

      <!-- Description -->
      <div v-if="property.description" class="text-sm text-gray-600">
        <p>{{ truncateDescription(property.description, isDescriptionExpanded) }}</p>
        <button 
          v-if="property.description.length > 200"
          @click="isDescriptionExpanded = !isDescriptionExpanded" 
          class="text-indigo-600 text-xs mt-2 hover:text-indigo-800"
        >
          {{ isDescriptionExpanded ? 'Read less' : 'Read more' }}
        </button>
      </div>
      
      <!-- Fire Risk Assessment Card -->
      <div class="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm" v-if="property.fireHazard">
        <div class="border-b border-gray-200 px-4 py-3 bg-gray-50">
          <div class="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
            </svg>
            <h3 class="text-base font-semibold text-gray-900">Fire Risk</h3>
          </div>
        </div>
        
        <div class="px-4 py-4 space-y-3">
          <!-- Risk Status -->
          <div class="flex justify-between">
            <span class="font-medium text-gray-600">Fire Hazard Zone</span>
            <span 
              :class="[
                property.fireHazard.inHazardZone ? 'text-red-600 font-bold' : 'text-green-600 font-bold',
              ]"
            >
              {{ property.fireHazard.inHazardZone ? 'Yes' : 'No' }}
            </span>
          </div>
          
          <!-- Severity or Nearest Zone -->
          <div class="flex justify-between" v-if="property.fireHazard.hazardZone || property.fireHazard.nearestHazardZone">
            <span class="font-medium text-gray-600">
              {{ property.fireHazard.inHazardZone ? 'Severity' : 'Nearest Zone' }}
            </span>
            <span :class="getSeverityClass(property.fireHazard.inHazardZone ? 
                property.fireHazard.hazardZone?.severity : 
                property.fireHazard.nearestHazardZone?.severity)">
              {{ property.fireHazard.inHazardZone ? 
                (property.fireHazard.hazardZone?.severity || 'Unknown') : 
                (property.fireHazard.nearestHazardZone?.severity || 'Unknown') }}
              <span v-if="!property.fireHazard.inHazardZone && property.fireHazard.nearestHazardZone?.distance_km" class="text-gray-500 text-sm">
                ({{ property.fireHazard.nearestHazardZone.distance_km.toFixed(1) }} km away)
              </span>
            </span>
          </div>
          
          <!-- Risk Assessment -->
          <div class="flex justify-between" v-if="property.fireHazard.riskAssessment">
            <span class="font-medium text-gray-600">Risk Category</span>
            <span :class="getSeverityClass(property.fireHazard.riskAssessment.category)">
              {{ property.fireHazard.riskAssessment.category || 'Unknown' }}
            </span>
          </div>
        </div>
      </div>
      
      <!-- View on Zillow Button -->
      <a 
        v-if="property.zpid || property.zillow?.zpid" 
        :href="`https://www.zillow.com/homedetails/${property.zpid || property.zillow?.zpid}_zpid/`" 
        target="_blank" 
        rel="noopener noreferrer" 
        class="block bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-md shadow-sm text-sm font-medium text-center transition-colors"
      >
        <div class="flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          View on Zillow
        </div>
      </a>
    </div>
    
    <!-- No data state -->
    <div v-else class="h-full flex flex-col items-center justify-center p-6 text-gray-500">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mb-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
      <p class="text-center">Search for a property to view details</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  property: {
    type: Object,
    default: null
  },
  loading: {
    type: Boolean,
    default: false
  }
});

// State variables
const currentImageIndex = ref(0);
const isDescriptionExpanded = ref(false);

// Get images from all possible sources in property data
const images = computed(() => {
  if (props.property?.zillow?.images?.length) {
    return props.property.zillow.images;
  }
  if (props.property?.imgSrc) {
    return [props.property.imgSrc];
  }
  return [];
});

const hasImages = computed(() => images.value.length > 0);
const imagesCount = computed(() => images.value.length);

// Helper to get current image
const currentImage = computed(() => {
  if (!hasImages.value) return null;
  return images.value[currentImageIndex.value];
});

// Functions for image carousel
const nextImage = () => {
  if (!hasImages.value) return;
  currentImageIndex.value = (currentImageIndex.value + 1) % images.value.length;
};

const prevImage = () => {
  if (!hasImages.value) return;
  currentImageIndex.value = (currentImageIndex.value - 1 + images.value.length) % images.value.length;
};

// Format price with dollar sign and commas
const formatPrice = (value) => {
  if (value == null || isNaN(value)) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value);
};

// Get full address from property data
const getFullAddress = () => {
  if (props.property?.fullAddress) {
    return props.property.fullAddress;
  }
  
  if (props.property?.address) {
    if (typeof props.property.address === 'string') {
      return props.property.address;
    }
    
    // Handle object format
    const addr = props.property.address;
    return [
      addr.streetAddress,
      addr.city,
      addr.state,
      addr.zipcode
    ].filter(Boolean).join(', ');
  }
  
  if (props.property?.streetAddress) {
    return [
      props.property.streetAddress,
      props.property.city,
      props.property.state,
      props.property.zipcode
    ].filter(Boolean).join(', ');
  }
  
  return 'Address unavailable';
};

// Truncate description with ellipsis
const truncateDescription = (text, expanded) => {
  if (!text) return '';
  if (expanded || text.length <= 200) return text;
  return text.substring(0, 200).trim() + '...';
};

// Helper function to get CSS class based on severity
const getSeverityClass = (severity) => {
  if (!severity) return '';
  
  const severityLower = (typeof severity === 'string') ? severity.toLowerCase() : '';
  if (severityLower.includes('very high')) return 'text-red-600 font-bold';
  if (severityLower.includes('high')) return 'text-orange-600 font-bold';
  if (severityLower.includes('moderate')) return 'text-yellow-600 font-bold';
  if (severityLower.includes('low')) return 'text-green-600';
  return 'text-blue-600';
};

// Reset currentImageIndex when property changes
watch(() => props.property, () => {
  currentImageIndex.value = 0;
  isDescriptionExpanded.value = false;
});
</script>