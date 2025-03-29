export default defineNuxtPlugin((nuxtApp) => {
  // Only run on client-side
  if (process.client) {
    // Use dynamic import to load the module only on the client side
    return import('@mapbox/search-js-web').then((mapboxsearch) => {
      // Make mapboxsearch available in the Nuxt app
      nuxtApp.provide('mapboxsearch', mapboxsearch)
    })
  }
})