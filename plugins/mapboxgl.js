import mapboxgl from 'mapbox-gl'
import "mapbox-gl/dist/mapbox-gl.css";

export default defineNuxtPlugin(nuxtApp => {
    nuxtApp.mapboxgl = mapboxgl
  })