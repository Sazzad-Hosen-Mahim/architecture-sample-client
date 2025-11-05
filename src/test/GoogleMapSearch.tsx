// import React, { useRef, useState } from "react";
// import {
//   GoogleMap,
//   LoadScript,
//   StandaloneSearchBox,
//   Marker,
// } from "@react-google-maps/api";

// const libraries: "places"[] = ["places"];

// const containerStyle = {
//   width: "100%",
//   height: "500px",
// };

// const center = {
//   lat: 23.8103,
//   lng: 90.4125,
// };

// export default function GoogleMapSearch() {
//   const [location, setLocation] = useState(center);
//   const searchBoxRef = useRef<google.maps.places.SearchBox | null>(null);

//   const onPlacesChanged = () => {
//     const places = searchBoxRef.current?.getPlaces();

//     if (!places || places.length === 0) return;

//     const place = places[0];

//     //  Safely check that geometry & location exist
//     if (place.geometry && place.geometry.location) {
//       const newLocation = {
//         lat: place.geometry.location.lat(),
//         lng: place.geometry.location.lng(),
//       };
//       setLocation(newLocation);
//     } else {
//       console.warn("No geometry found for selected place.");
//     }
//   };

//   return (
//     <LoadScript
//       googleMapsApiKey="AIzaSyBhIGdEAG1Kqsifr5aaxlTfYxwSNTVCq3o"
//       libraries={libraries}
//     >
//       <div className="mb-4">
//         <StandaloneSearchBox
//           onLoad={(ref) => (searchBoxRef.current = ref)}
//           onPlacesChanged={onPlacesChanged}
//         >
//           <input
//             type="text"
//             placeholder="Search for a place"
//             className="border p-2 w-full rounded"
//           />
//         </StandaloneSearchBox>
//       </div>

//       <GoogleMap mapContainerStyle={containerStyle} center={location} zoom={12}>
//         <Marker position={location} />
//       </GoogleMap>
//     </LoadScript>
//   );
// }

import { useRef, useState } from "react";
import {
  GoogleMap,
  LoadScript,
  StandaloneSearchBox,
  Marker,
  Libraries,
} from "@react-google-maps/api";

// ✅ Define allowed libraries type
const libraries: Libraries = ["places"];

const containerStyle = {
  width: "100%",
  height: "500px",
};

const defaultCenter = {
  lat: 23.8103, // Dhaka
  lng: 90.4125,
};

interface GoogleMapSearchProps {
  onLocationSelect?: (location: { lat: number; lng: number }) => void;
}

export default function GoogleMapSearch({
  onLocationSelect,
}: GoogleMapSearchProps) {
  const [location, setLocation] = useState(defaultCenter);
  const searchBoxRef = useRef<google.maps.places.SearchBox | null>(null);

  const onPlacesChanged = () => {
    const places = searchBoxRef.current?.getPlaces();
    if (!places || places.length === 0) return;

    const place = places[0];

    // ✅ TypeScript-safe check for geometry
    if (place.geometry?.location) {
      const newLocation = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      };
      setLocation(newLocation);

      // 🔥 Send coordinates to parent component
      onLocationSelect?.(newLocation);
    } else {
      console.warn("Selected place has no geometry information.");
    }
  };

  return (
    <LoadScript
      googleMapsApiKey="AIzaSyBhIGdEAG1Kqsifr5aaxlTfYxwSNTVCq3o"
      libraries={libraries}
    >
      <div className="mb-4">
        <StandaloneSearchBox
          onLoad={(ref) => (searchBoxRef.current = ref)}
          onPlacesChanged={onPlacesChanged}
        >
          <input
            type="text"
            placeholder="Search for a place"
            className="border p-2 w-full rounded"
          />
        </StandaloneSearchBox>
      </div>

      <GoogleMap mapContainerStyle={containerStyle} center={location} zoom={12}>
        <Marker position={location} />
      </GoogleMap>
    </LoadScript>
  );
}
