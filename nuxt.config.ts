// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt'],
  runtimeConfig: {
    public: {
      MAPBOX_API_TOKEN: process.env.MAPBOX_API_TOKEN,
      GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
      FIRE_HAZARD_API: process.env.FIRE_HAZARD_API
    }
  }
})
