<template>
  <div class="flex h-screen w-screen overflow-hidden">
    <!-- Map Area -->
    <div class="h-full relative bg-gray-300" style="width: 100%;">
      <MapDisplay
        v-if="propertyData && mapboxToken"
        :access-token="mapboxToken"
        :property="propertyData"
      />
      <div v-else-if="pending" class="absolute inset-0 flex items-center justify-center bg-gray-200">
          <p>Loading Map...</p>
      </div>
       <div v-else-if="error || !mapboxToken" class="absolute inset-0 flex items-center justify-center bg-red-100 text-red-700 p-4">
         <p v-if="!mapboxToken">Mapbox Token is missing. Please check configuration.</p>
         <p v-else>Error loading property data or map: {{ error?.message }}</p>
       </div>
    </div>
  </div>
</template>

<script setup>
// Access Runtime Config for the Mapbox token
const config = useRuntimeConfig();
const mapboxToken = ref(config.public.MAPBOX_API_TOKEN);

// Fetch the static property data
// Using $fetch which is auto-imported and works well for client-side fetching of public assets
const propertyData = ref(null);
const pending = ref(true);
const error = ref(null);

onMounted(async () => {
  if (!mapboxToken.value) {
     console.error("Mapbox API token is not configured in runtimeConfig.public.MAPBOX_API_TOKEN");
     pending.value = false;
     error.value = new Error("Mapbox token missing");
     return;
  }
  try {
    // $fetch automatically handles JSON parsing
    const data = await $fetch('/property-data.json');
    propertyData.value = data;
  } catch (err) {
    console.error('Failed to fetch property data:', err);
    error.value = err;
  } finally {
    pending.value = false;
  }
});

</script>

<style>
/* Ensure body has no margin/padding if needed */
body {
  margin: 0;
  padding: 0;
  overflow: hidden; /* Prevent scrollbars on body due to h-screen */
}
</style>