<template>
    <div class="h-full overflow-y-auto bg-white p-6 shadow-lg border-l border-gray-200 text-sm">
      <div v-if="property" class="space-y-6">
        <!-- Image -->
        <div v-if="property.imgSrc">
          <img :src="property.imgSrc" alt="Property image" class="w-full h-48 object-cover rounded-lg shadow">
        </div>
        <div v-else class="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500">
            No Image Available
        </div>
  
        <!-- Price & Status -->
        <div class="flex justify-between items-start">
          <div>
            <p class="text-3xl font-bold text-gray-900">{{ formatPrice(property.price) }}</p>
            <p v-if="property.streetAddress" class="text-sm text-gray-600 mt-1">
                {{ property.streetAddress }}, {{ property.city }}, {{ property.state }} {{ property.zipcode }}
            </p>
          </div>
          <span v-if="property.homeStatus"
                :class="getStatusClasses(property.homeStatus)"
                class="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium capitalize">
            {{ property.homeStatus.replace('_', ' ').toLowerCase() }}
          </span>
        </div>
  
        <!-- Key Land Facts -->
        <div class="border-t border-b border-gray-200 py-4">
           <h3 class="text-base font-semibold leading-6 text-gray-900 mb-3">Land Overview</h3>
           <dl class="grid grid-cols-2 gap-x-4 gap-y-4">
             <div v-if="property.resoFacts?.lotSize">
               <dt class="font-medium text-gray-500">Lot Size</dt>
               <dd class="mt-1 font-semibold text-gray-900">{{ property.resoFacts.lotSize }}</dd>
             </div>
             <div v-if="property.lotInfo?.lotSquareFeet">
               <dt class="font-medium text-gray-500">Lot Sqft</dt>
               <dd class="mt-1 font-semibold text-gray-900">{{ property.lotInfo.lotSquareFeet.toLocaleString() }}</dd>
             </div>
             <div v-if="property.resoFacts?.zoning || property.lotInfo?.zoning">
               <dt class="font-medium text-gray-500">Zoning</dt>
               <dd class="mt-1 font-semibold text-gray-900">{{ property.resoFacts?.zoning || property.lotInfo?.zoning }}</dd>
             </div>
              <div v-if="property.homeType">
               <dt class="font-medium text-gray-500">Property Type</dt>
               <dd class="mt-1 font-semibold text-gray-900">{{ property.homeType }}</dd>
             </div>
           </dl>
        </div>
  
        <!-- Risk Assessment -->
         <div class="space-y-3">
            <h3 class="text-base font-semibold leading-6 text-gray-900">Risk Assessment</h3>
             <div class="flex justify-between">
               <span class="font-medium text-gray-500">Flood Zone</span>
               <span class="font-semibold text-gray-900" :class="getRiskColor(property.climate?.floodSources?.primary?.riskScore?.value)">
                  {{ property.climate?.floodSources?.primary?.riskScore?.label || 'N/A' }}
                  ({{ property.climate?.floodSources?.primary?.femaZone || 'N/A' }})
               </span>
            </div>
            <div class="flex justify-between">
               <span class="font-medium text-gray-500">Wildfire Risk</span>
                <span class="font-semibold text-gray-900" :class="getRiskColor(property.climate?.fireSources?.primary?.riskScore?.value)">
                   {{ property.climate?.fireSources?.primary?.riskScore?.label || 'N/A' }}
                   ({{ property.climate?.fireSources?.primary?.riskScore?.value }}/10)
                </span>
            </div>
             <div class="flex justify-between">
               <span class="font-medium text-gray-500">Wind Risk</span>
               <span class="font-semibold text-gray-900" :class="getRiskColor(property.climate?.windSources?.primary?.riskScore?.value)">
                  {{ property.climate?.windSources?.primary?.riskScore?.label || 'N/A' }}
                  ({{ property.climate?.windSources?.primary?.riskScore?.value }}/10)
               </span>
            </div>
              <!-- Add Heat/Air Quality if needed -->
         </div>
  
  
        <!-- Description -->
        <div v-if="property.description">
          <h3 class="text-base font-semibold leading-6 text-gray-900">Description</h3>
          <p class="mt-2 text-gray-600">{{ property.description }}</p>
        </div>
  
        <!-- More Details (Example using resoFacts & lotInfo) -->
        <div class="space-y-3 border-t pt-4">
          <h3 class="text-base font-semibold leading-6 text-gray-900">Property Details</h3>
           <div class="flex justify-between">
              <span class="font-medium text-gray-500">APN</span>
              <span class="font-medium text-gray-900">{{ property.lotInfo?.apn || 'N/A' }}</span>
           </div>
           <div class="flex justify-between">
              <span class="font-medium text-gray-500">Topography</span>
              <span class="font-medium text-gray-900">{{ property.resoFacts?.topography || 'N/A' }}</span>
           </div>
           <div class="flex justify-between">
              <span class="font-medium text-gray-500">Utilities</span>
              <span class="font-medium text-gray-900 text-right">{{ formatArray(property.resoFacts?.utilities) }}</span>
           </div>
            <div class="flex justify-between">
              <span class="font-medium text-gray-500">Water Source</span>
              <span class="font-medium text-gray-900">{{ formatArray(property.resoFacts?.waterSource) }}</span>
           </div>
            <div class="flex justify-between">
              <span class="font-medium text-gray-500">Sewer</span>
              <span class="font-medium text-gray-900">{{ formatArray(property.resoFacts?.sewer) }}</span>
           </div>
            <div class="flex justify-between">
              <span class="font-medium text-gray-500">Subdivision</span>
              <span class="font-medium text-gray-900">{{ property.resoFacts?.subdivisionName || 'N/A' }}</span>
           </div>
        </div>
  
         <!-- Tax Info -->
         <div class="space-y-3 border-t pt-4">
           <h3 class="text-base font-semibold leading-6 text-gray-900">Tax Information ({{ property.taxInfo?.assessmentYear || 'N/A' }})</h3>
           <div class="flex justify-between">
             <span class="font-medium text-gray-500">Tax Amount</span>
             <span class="font-medium text-gray-900">{{ formatPrice(property.taxInfo?.taxAmount) }}</span>
           </div>
           <div class="flex justify-between">
             <span class="font-medium text-gray-500">Assessed Value</span>
             <span class="font-medium text-gray-900">{{ formatPrice(property.taxInfo?.assessedValue) }}</span>
           </div>
            <div class="flex justify-between">
             <span class="font-medium text-gray-500">Land Assessed</span>
             <span class="font-medium text-gray-900">{{ formatPrice(property.taxInfo?.assessedLandValue) }}</span>
           </div>
         </div>
  
        <!-- Action Button (Example) -->
         <button type="button" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md shadow-sm font-medium mt-6">
          Generate Land Report (Coming Soon)
        </button>
  
      </div>
      <div v-else class="text-center text-gray-500 py-10">
        <p>Loading property details...</p>
      </div>
    </div>
  </template>
  
  <script setup>
  import { computed } from 'vue';
  
  const props = defineProps({
    property: {
      type: Object,
      default: null,
    },
  });
  
  const formatPrice = (value) => {
    const number = Number(value); // Ensure it's a number
    if (value == null || isNaN(number)) return 'N/A';
    return number.toLocaleString('en-US', {
      style: 'currency',
      currency: props.property?.currency || 'USD', // Use property's currency if available
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };
  
  const formatArray = (value) => {
      if(!Array.isArray(value) || value.length === 0) return 'N/A';
      return value.join(', ');
  }
  
  // Basic status styling - adjust as needed
  const getStatusClasses = (status) => {
    const lowerStatus = status?.toLowerCase().replace('_', ' ');
    if (lowerStatus === 'for sale' || lowerStatus === 'active') {
      return 'bg-green-100 text-green-800';
    }
    if (lowerStatus === 'pending') {
      return 'bg-yellow-100 text-yellow-800';
    }
    if (lowerStatus === 'sold') {
      return 'bg-blue-100 text-blue-800';
    }
     if (lowerStatus === 'off market' || lowerStatus === 'cancelled' || lowerStatus === 'failed') {
      return 'bg-gray-100 text-gray-800';
    }
    return 'bg-purple-100 text-purple-800'; // Default for others like 'LOT' status
  };
  
  // Color coding for risk scores (example)
  const getRiskColor = (score) => {
      if (score == null) return 'text-gray-900'; // Default if no score
      if (score <= 1) return 'text-green-600'; // Minimal
      if (score <= 3) return 'text-yellow-600'; // Minor
      if (score <= 6) return 'text-orange-600'; // Moderate
      if (score <= 8) return 'text-red-600'; // Major/Severe
      return 'text-red-800'; // Extreme
  }
  
  </script>
  
  <style scoped>
  /* Add any sidebar-specific styles here if needed */
  </style>