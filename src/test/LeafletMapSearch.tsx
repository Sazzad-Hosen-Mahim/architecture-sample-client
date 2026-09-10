// src/test/LeafletMapSearch.tsx
import { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Tooltip,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Clamp vertical panning to the drawable part of the Web Mercator world so the
// view can't drift into the empty gray area above/below the map. Longitude is
// left wide open so tiles still wrap horizontally without gray edges.
const WORLD_BOUNDS: L.LatLngBoundsExpression = [
  [-85, -720],
  [85, 720],
];

interface LeafletMapSearchProps {
  onLocationSelect?: (coords: { lat: number; lng: number } | null) => void;
  onProjectClick?: (id: string) => void;
  projects?: any[];
  /**
   * The location filter as the page holds it, so the pin follows it.
   *
   * The map used to own this outright, which meant clearing the filters from
   * the bar above dropped the filter but left the pin sitting there with
   * nothing to remove it — the pin's own Clear link was the only way, and that
   * is gone now.
   */
  selectedLocation?: { lat: number; lng: number } | null;
}

export default function LeafletMapSearch({
  onLocationSelect,
  onProjectClick,
  projects = [],
  selectedLocation,
}: LeafletMapSearchProps) {
  const [selected, setSelected] = useState<{ lat: number; lng: number } | null>(
    selectedLocation ?? null
  );

  // Follow the page's filter. Clicking the map still sets the pin immediately —
  // the page is told at the same moment, so the two agree — but a clear from
  // the filter bar now takes the pin with it.
  //
  // Tracked as two numbers rather than the object: a parent that built the
  // value inline would hand over a new object every render, and setting state
  // from it would re-render and do it again.
  const filterLat = selectedLocation?.lat ?? null;
  const filterLng = selectedLocation?.lng ?? null;
  useEffect(() => {
    setSelected(
      filterLat !== null && filterLng !== null
        ? { lat: filterLat, lng: filterLng }
        : null,
    );
  }, [filterLat, filterLng]);
  const mapRef = useRef<L.Map | null>(null);

  // Leaflet measures the container once on mount. If the page is still laying out
  // (or the viewport later resizes), the map keeps its stale size and tiles only
  // cover part of the box — the rest shows the gray Leaflet background. Nudging
  // it with invalidateSize makes the map fill the whole box.
  useEffect(() => {
    const invalidate = () => mapRef.current?.invalidateSize();
    const timer = setTimeout(invalidate, 150);
    window.addEventListener("resize", invalidate);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", invalidate);
    };
  }, []);

  // Fly map to bounds when projects changes
  useEffect(() => {
    if (mapRef.current && projects.length > 0) {
      const markers = projects
        .filter((p) => p.location && p.location.lat && p.location.lng)
        .map((p) => L.marker([p.location.lat, p.location.lng]));

      if (markers.length > 0) {
        const group = L.featureGroup(markers);
        // Cap the zoom so a wide marker spread (e.g. one project per continent)
        // can't zoom the map out past the point where the world fills the box
        // and leaves gray bars top and bottom.
        mapRef.current.fitBounds(group.getBounds(), {
          padding: [40, 40],
          maxZoom: 6,
        });
      }
    }
  }, [projects]);

  // Handle map click
  function LocationMarker() {
    useMapEvents({
      click(e) {
        const coords = { lat: e.latlng.lat, lng: e.latlng.lng };
        if (selected && selected.lat === coords.lat && selected.lng === coords.lng) {
          setSelected(null);
          onLocationSelect?.(null);
        } else {
          setSelected(coords);
          onLocationSelect?.(coords);
        }
      },
    });

    // Just the pin. It carried a permanent tooltip — "Filtering projects near
    // this area" with a Clear link — which sat over the map as a white card on
    // a phone and covered the very pins it was describing. The filter bar above
    // already says a location filter is on and already clears it, so the card
    // was a second control for something the page states plainly elsewhere.
    return selected ? <Marker position={selected} /> : null;
  }

  return (
    <div
      className="relative w-full h-[400px] rounded-xl shadow overflow-hidden"
      style={{ zIndex: 1 }}
    >
      {/* Map */}
      <MapContainer
        center={[20, 0]}
        zoom={2}
        minZoom={1}
        maxBounds={WORLD_BOUNDS}
        maxBoundsViscosity={1}
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          zIndex: 1,
        }}
        ref={mapRef}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
        />

        {/* Click marker */}
        <LocationMarker />

        {/* Project markers */}
        {projects.map((project) => (
          project.location && project.location.lat ? (
            <Marker
              key={project.id}
              position={[project.location.lat, project.location.lng]}
              eventHandlers={{ click: () => onProjectClick?.(project.id) }}
            >
              <Tooltip>
                <strong>{project.name}</strong>
                <br />
                {project.locationName}
              </Tooltip>
            </Marker>
          ) : null
        ))}
      </MapContainer>
    </div>
  );
}

// src/test/LeafletMapSearch.tsx
// import { useEffect, useState } from "react";
// import {
//   MapContainer,
//   TileLayer,
//   Marker,
//   Popup,
//   useMapEvents,
// } from "react-leaflet";
// import "leaflet/dist/leaflet.css";
// import L from "leaflet";

// //   Fix Leaflet default icon issue
// delete (L.Icon.Default.prototype as any)._getIconUrl;
// L.Icon.Default.mergeOptions({
//   iconRetinaUrl:
//     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
//   iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
//   shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
// });

// interface LeafletMapSearchProps {
//   onLocationSelect?: (coords: { lat: number; lng: number }) => void;
// }

// export default function LeafletMapSearch({
//   onLocationSelect,
// }: LeafletMapSearchProps) {
//   const [selected, setSelected] = useState<{ lat: number; lng: number } | null>(
//     null
//   );
//   const [country, setCountry] = useState<string>("");

//   // Reverse geocode using OpenCage (English)
//   const fetchCountry = async (lat: number, lng: number) => {
//     const apiKey = "YOUR_OPENCAGE_API_KEY"; // Get free key from https://opencagedata.com/
//     try {
//       const res = await fetch(
//         `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${apiKey}&language=en`
//       );
//       const data = await res.json();
//       const countryName = data?.results?.[0]?.components?.country || "";
//       setCountry(countryName);
//     } catch (err) {
//       console.error("Reverse geocoding error:", err);
//       setCountry("");
//     }
//   };

//   // Handle map clicks
//   function LocationMarker() {
//     useMapEvents({
//       click(e) {
//         const coords = { lat: e.latlng.lat, lng: e.latlng.lng };
//         setSelected(coords);
//         onLocationSelect?.(coords);
//         fetchCountry(coords.lat, coords.lng);
//       },
//     });

//     return selected ? (
//       <Marker position={selected}>
//         <Popup>
//           📍 Selected Location
//           <br />
//           Lat: {selected.lat.toFixed(4)}, Lng: {selected.lng.toFixed(4)}
//           <br />
//           Country: {country || "Unknown"}
//         </Popup>
//       </Marker>
//     ) : null;
//   }

//   return (
//     <div className="w-full h-[400px] rounded-xl overflow-hidden shadow">
//       <MapContainer
//         center={[20, 0]} // world view
//         zoom={2}
//         style={{ width: "100%", height: "100%" }}
//       >
//         <TileLayer
//           url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
//           attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
//         />
//         <LocationMarker />
//       </MapContainer>
//     </div>
//   );
// }
