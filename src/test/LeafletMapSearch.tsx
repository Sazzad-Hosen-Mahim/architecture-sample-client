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

interface LeafletMapSearchProps {
  onLocationSelect?: (coords: { lat: number; lng: number } | null) => void;
  onProjectClick?: (id: string) => void;
  projects?: any[];
}

export default function LeafletMapSearch({
  onLocationSelect,
  onProjectClick,
  projects = [],
}: LeafletMapSearchProps) {
  const [selected, setSelected] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const mapRef = useRef<L.Map | null>(null);

  // Fly map to bounds when projects changes
  useEffect(() => {
    if (mapRef.current && projects.length > 0) {
      const markers = projects
        .filter(p => p.location && p.location.lat && p.location.lng)
        .map((p) => L.marker([p.location.lat, p.location.lng]));

      if (markers.length > 0) {
        const group = L.featureGroup(markers);
        mapRef.current.fitBounds(group.getBounds().pad(0.5));
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

    return selected ? (
      <Marker position={selected}>
        <Tooltip permanent>
          📍 Filtering projects near this area
          <br />
          <button
            onClick={() => { setSelected(null); onLocationSelect?.(null); }}
            className="text-blue-500 underline mt-1"
          >
            Clear map filter
          </button>
        </Tooltip>
      </Marker>
    ) : null;
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
