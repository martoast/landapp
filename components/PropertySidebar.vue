<template>
    <div class="h-full overflow-y-auto bg-white p-6 shadow-lg border-l border-gray-200">
      <div v-if="property && property.propertyInfo" class="space-y-6">
        <!-- Image -->
        <div v-if="property.imgSrc">
          <img :src="property.imgSrc" alt="Property image" class="w-full h-48 object-cover rounded-lg shadow">
        </div>
  
        <!-- Price & Status -->
        <div class="flex justify-between items-start">
          <div>
            <p class="text-3xl font-bold text-gray-900">{{ formatPrice(property.estimatedValue) }}</p>
            <p v-if="property.propertyInfo.address?.label" class="text-sm text-gray-600 mt-1">{{ property.propertyInfo.address.label }}</p>
          </div>
          <span v-if="property.mlsStatus"
                :class="getStatusClasses(property.mlsStatus)"
                class="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium">
            {{ property.mlsStatus }}
          </span>
        </div>
  
        <!-- Key Facts -->
        <div class="border-t border-b border-gray-200 py-4">
          <dl class="grid grid-cols-3 gap-x-4 gap-y-4 text-center">
            <div v-if="property.propertyInfo.bedrooms">
              <dt class="text-sm font-medium text-gray-500">Beds</dt>
              <dd class="mt-1 text-lg font-semibold text-gray-900">{{ property.propertyInfo.bedrooms }}</dd>
            </div>
            <div v-if="property.propertyInfo.bathrooms">
              <dt class="text-sm font-medium text-gray-500">Baths</dt>
              <dd class="mt-1 text-lg font-semibold text-gray-900">{{ property.propertyInfo.bathrooms }}</dd>
            </div>
            <div v-if="property.propertyInfo.livingSquareFeet">
              <dt class="text-sm font-medium text-gray-500">Sqft</dt>
              <dd class="mt-1 text-lg font-semibold text-gray-900">{{ property.propertyInfo.livingSquareFeet.toLocaleString() }}</dd>
            </div>
          </dl>
        </div>
  
        <!-- Description -->
        <div v-if="property.propertyInfo.description">
          <h3 class="text-lg font-medium text-gray-900">Description</h3>
          <p class="mt-2 text-sm text-gray-600">{{ property.propertyInfo.description }}</p>
        </div>
  
        <!-- More Details (Example) -->
        <div class="space-y-2">
          <h3 class="text-lg font-medium text-gray-900">Details</h3>
           <div class="flex justify-between text-sm">
              <span class="text-gray-500">Property Type</span>
              <span class="text-gray-900 font-medium">{{ property.propertyInfo.propertyUse || 'N/A' }}</span>
           </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">Year Built</span>
              <span class="text-gray-900 font-medium">{{ property.propertyInfo.yearBuilt || 'N/A' }}</span>
           </div>
           <div class="flex justify-between text-sm">
              <span class="text-gray-500">APN</span>
              <span class="text-gray-900 font-medium">{{ property.lotInfo?.apn || 'N/A' }}</span> <!-- Example using optional chaining -->
           </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">Lot Size (sqft)</span>
              <span class="text-gray-900 font-medium">{{ property.propertyInfo.lotSquareFeet?.toLocaleString() || 'N/A' }}</span>
           </div>
        </div>
  
        <!-- Action Button (Example) -->
         <button type="button" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md shadow-sm text-sm font-medium">
          Get Report (Coming Soon)
        </button>
  
      </div>
      <div v-else class="text-center text-gray-500 py-10">
        <p>No property details to display.</p>
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
    if (value == null) return 'N/A';
    return value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };
  
  // Basic status styling - expand as needed
  const getStatusClasses = (status) => {
    const lowerStatus = status?.toLowerCase();
    if (lowerStatus === 'for sale' || lowerStatus === 'active') {
      return 'bg-green-100 text-green-800';
    }
    if (lowerStatus === 'pending') {
      return 'bg-yellow-100 text-yellow-800';
    }
    if (lowerStatus === 'sold') {
      return 'bg-blue-100 text-blue-800';
    }
    return 'bg-gray-100 text-gray-800'; // Default for Off Market, Cancelled, etc.
  };
  </script>
  
  <style scoped>
  /* Add any sidebar-specific styles here if needed */
  </style>