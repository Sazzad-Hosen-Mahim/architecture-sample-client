// src/test/LeafletMapSearch.tsx
import { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { worldProjects } from "@/data/worldProjects";

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface LeafletMapSearchProps {
  onLocationSelect?: (coords: { lat: number; lng: number }) => void;
}

export default function LeafletMapSearch({
  onLocationSelect,
}: LeafletMapSearchProps) {
  const [selected, setSelected] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const mapRef = useRef<L.Map | null>(null);

  // Filter projects by city or country
  const filteredProjects = worldProjects.filter(
    (p) =>
      p.locationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Fly map to bounds when filteredProjects changes
  useEffect(() => {
    if (mapRef.current && filteredProjects.length > 0) {
      const group = L.featureGroup(
        filteredProjects.map((p) => L.marker([p.location.lat, p.location.lng]))
      );
      mapRef.current.fitBounds(group.getBounds().pad(0.5));
    }
  }, [filteredProjects]);

  // Handle map click
  function LocationMarker() {
    useMapEvents({
      click(e) {
        const coords = { lat: e.latlng.lat, lng: e.latlng.lng };
        setSelected(coords);
        onLocationSelect?.(coords);
      },
    });

    return selected ? (
      <Marker position={selected}>
        <Popup>
          📍 Selected Location
          <br />
          Lat: {selected.lat.toFixed(4)}, Lng: {selected.lng.toFixed(4)}
        </Popup>
      </Marker>
    ) : null;
  }

  return (
    <div
      className="relative w-full h-[400px] rounded-xl shadow overflow-hidden"
      style={{ zIndex: 1 }}
    >
      {/* Search input - positioned above map but below navbar */}
      <div className="absolute top-4 left-16 z-[10] w-72 pointer-events-auto">
        <input
          type="text"
          placeholder="Search by city or country..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-1 border rounded-lg outline-none  shadow bg-white"
        />
      </div>

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
        {filteredProjects.map((project) => (
          <Marker
            key={project.id}
            position={[project.location.lat, project.location.lng]}
          >
            <Popup>
              <strong>{project.name}</strong>
              <br />
              {project.locationName}, {project.country}
            </Popup>
          </Marker>
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

// // ✅ Fix Leaflet default icon issue
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
