"use client";

import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";

// Fix for default Leaflet marker icons breaking in webpack/bundlers
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export interface MarkedByUser {
  _id?: string;
  id?: string;
  username?: string;
  avatar?: string | { url?: string; id?: string };
  avatarUrl?: string;
  role?: string;
  email?: string;
}

export interface Report {
  id: string;
  lat: number;
  lng: number;
  title: string;
  status: "critical" | "moderate" | "claimed" | "resolved";
  severity?: string;
  category?: string;
  volunteersNeeded?: number;
  distance?: string;
  image?: string;
  markedBy?: MarkedByUser | string;
  markedAt?: string;
  isCompleted?: boolean;
  isAssignedBy?: any[];
  isCompletedBy?: any[];
}

export interface SafaiMapInnerProps {
  reports?: Report[];
  selectedCoordinates?: [number, number] | null;
  routingTarget?: [number, number] | null;
  onSelectCoordinates?: (coords: [number, number]) => void;
  onSelectReport?: (report: Report) => void;
  onClearRouting?: () => void;
  center?: [number, number];
  zoom?: number;
  className?: string;
}

// Fallback coordinates (New Delhi)
const DEFAULT_CENTER: [number, number] = [28.6139, 77.209];
const DEFAULT_ZOOM = 14;

// Custom Leaflet DivIcon Generators to match Stitch Design Aesthetic
const createCustomMarkerIcon = (status: Report["status"]) => {
  let bgColor = "bg-emerald-500";
  let iconName = "check";
  let pulseClass = "";

  if (status === "critical") {
    bgColor = "bg-[#DC2626]";
    iconName = "delete";
    pulseClass = "pulse-shadow";
  } else if (status === "moderate") {
    bgColor = "bg-amber-500";
    iconName = "warning";
  } else if (status === "claimed") {
    bgColor = "bg-indigo-500";
    iconName = "cleaning_services";
  }

  const html = `
    <div class="flex items-center justify-center group cursor-pointer">
      <div class="w-9 h-9 ${bgColor} rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white ${pulseClass} transition-transform group-hover:scale-110">
        <span class="material-symbols-outlined text-[18px]">${iconName}</span>
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: "custom-leaflet-pin !bg-transparent !border-0",
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
};

// Selected Pin Drop Marker Icon
const dropPinIcon = L.divIcon({
  html: `
    <div class="flex items-center justify-center animate-bounce">
      <div class="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white shadow-xl border-2 border-white">
        <span class="material-symbols-outlined text-[20px]">location_on</span>
      </div>
    </div>
  `,
  className: "custom-drop-pin !bg-transparent !border-0",
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -22],
});

// Component to handle map clicks for dropping pin
function ClickHandler({
  onSelectCoordinates,
}: {
  onSelectCoordinates?: (coords: [number, number]) => void;
}) {
  useMapEvents({
    click(e) {
      if (onSelectCoordinates) {
        onSelectCoordinates([e.latlng.lat, e.latlng.lng]);
      }
    },
  });
  return null;
}

// Component to fly map to new center on geolocation update
function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, map.getZoom(), { animate: true, duration: 1.2 });
    }
  }, [center, map]);
  return null;
}

// Component to handle turn-by-turn routing using leaflet-routing-machine
function RoutingControl({
  userLocation,
  destination,
  onClearRouting,
}: {
  userLocation: [number, number];
  destination: [number, number];
  onClearRouting?: () => void;
}) {
  const map = useMap();

  const userLat = userLocation?.[0];
  const userLng = userLocation?.[1];
  const destLat = destination?.[0];
  const destLng = destination?.[1];

  const onClearRef = React.useRef(onClearRouting);
  useEffect(() => {
    onClearRef.current = onClearRouting;
  }, [onClearRouting]);

  useEffect(() => {
    if (
      !map ||
      userLat === undefined ||
      userLng === undefined ||
      destLat === undefined ||
      destLng === undefined
    ) {
      return;
    }

    let routingControl: any = null;

    try {
      // Create Routing machine control on map
      // @ts-ignore L.Routing is populated by leaflet-routing-machine
      routingControl = L.Routing.control({
        waypoints: [
          L.latLng(userLat, userLng),
          L.latLng(destLat, destLng),
        ],
        routeWhileDragging: false,
        addWaypoints: false,
        show: true,
        collapsible: true,
        fitSelectedRoutes: true,
        showAlternatives: false,
        lineOptions: {
          styles: [{ color: "#006948", weight: 6, opacity: 0.85 }],
          extendToWaypoints: true,
          missingRouteTolerance: 0,
        },
      }).addTo(map);

      // Inject custom Close Route button into leaflet-routing-machine control panel
      const container = routingControl.getContainer();
      if (container && onClearRef.current) {
        const closeBtn = document.createElement("button");
        closeBtn.innerHTML = `
          <div style="display:flex; align-items:center; justify-content:space-between; width:100%;">
            <span style="display:flex; align-items:center; gap:6px;">
              <span style="width:7px; height:7px; background:#ffffff; border-radius:50%; display:inline-block; box-shadow:0 0 6px rgba(255,255,255,0.8);"></span>
              <span>End Route Navigation</span>
            </span>
            <span style="font-size:14px; font-weight:800; opacity:0.9;">✕</span>
          </div>
        `;
        closeBtn.className = "custom-routing-close-btn";
        closeBtn.onclick = (e) => {
          e.stopPropagation();
          onClearRef.current?.();
        };
        container.insertBefore(closeBtn, container.firstChild);
      }
    } catch (err) {
      console.warn("Could not initialize routing control:", err);
    }

    return () => {
      if (!routingControl) return;

      try {
        // Grab container reference before removal
        const container = routingControl.getContainer?.();

        // Safe guard against leaflet-routing-machine's null _map error
        if (!routingControl._map) {
          routingControl._map = map;
        }

        // Safely remove line layer from map if active
        if (routingControl._line && map) {
          try {
            if (typeof map.hasLayer === "function" && map.hasLayer(routingControl._line)) {
              map.removeLayer(routingControl._line);
            }
          } catch (e) {}
          routingControl._line = null;
        }

        // Safely clear waypoints
        try {
          if (routingControl.getPlan && typeof routingControl.getPlan === "function") {
            const plan = routingControl.getPlan();
            if (plan && typeof plan.setWaypoints === "function") {
              plan.setWaypoints([]);
            }
          }
        } catch (e) {}

        // Safely remove control from map
        if (map && typeof map.removeControl === "function") {
          map.removeControl(routingControl);
        }

        // Force-remove the container DOM element if it still exists
        if (container && container.parentNode) {
          container.parentNode.removeChild(container);
        }
      } catch (e) {
        // Catch any remaining Leaflet unmount layer removal exception
      }
    };
  }, [map, userLat, userLng, destLat, destLng]);

  return null;
}

export default function SafaiMapInner({
  reports = [],
  selectedCoordinates,
  routingTarget,
  onSelectCoordinates,
  onSelectReport,
  onClearRouting,
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  className = "w-full h-full",
}: SafaiMapInnerProps) {
  const [mapCenter, setMapCenter] = useState<[number, number]>(center);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Dynamic Geolocation upon mount
  useEffect(() => {
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userCoords: [number, number] = [
            position.coords.latitude,
            position.coords.longitude,
          ];
          setUserLocation(userCoords);
          setMapCenter(userCoords);
        },
        (error) => {
          console.warn("Geolocation permission denied or unavailable:", error.message);
          setGeoError("Using default city location (Delhi)");
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }, []);

  return (
    <div className={`relative ${className}`}>
      {/* Map Container */}
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
        style={{ width: "100%", height: "100%", minHeight: "350px" }}
      >
        <MapController center={mapCenter} />

        {/* TileLayer using OpenStreetMap */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* Map Click Listener for Pin Drop */}
        <ClickHandler onSelectCoordinates={onSelectCoordinates} />

        {/* Active Leaflet Routing Machine Layer */}
        {routingTarget && (
          <RoutingControl
            userLocation={userLocation || DEFAULT_CENTER}
            destination={routingTarget}
            onClearRouting={onClearRouting}
          />
        )}

        {/* User Current GPS Location Marker */}
        {userLocation && (
          <Marker
            position={userLocation}
            icon={L.divIcon({
              html: `
                <div class="relative flex items-center justify-center w-6 h-6">
                  <div class="absolute w-6 h-6 bg-blue-500/30 rounded-full animate-ping"></div>
                  <div class="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-md"></div>
                </div>
              `,
              className: "user-gps-marker",
              iconSize: [24, 24],
              iconAnchor: [12, 12],
            })}
          >
            <Popup>
              <div className="p-1 font-sans text-xs">
                <p className="font-bold text-blue-700">📍 You are here</p>
                <p className="text-gray-500 text-[10px]">
                  {userLocation[0].toFixed(4)}, {userLocation[1].toFixed(4)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Selected Dropped Pin Marker */}
        {selectedCoordinates && (
          <Marker position={selectedCoordinates} icon={dropPinIcon}>
            <Popup>
              <div className="p-1 font-sans text-xs">
                <span className="font-bold text-[#006948] block mb-1">
                  📍 Selected Waste Report Site
                </span>
                <span className="text-gray-600 font-mono text-[10px] block">
                  {selectedCoordinates[0].toFixed(5)}, {selectedCoordinates[1].toFixed(5)}
                </span>
                <span className="text-[10px] text-gray-500 mt-1 block italic">
                  Click elsewhere to relocate pin.
                </span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Existing Reports Layer */}
        {reports.map((report) => (
          <Marker
            key={report.id}
            position={[report.lat, report.lng]}
            icon={createCustomMarkerIcon(report.status)}
            eventHandlers={{
              click: () => {
                if (onSelectReport) onSelectReport(report);
              },
            }}
          />
        ))}
      </MapContainer>



      {/* Geolocation Notice Indicator */}
      {geoError && (
        <div className="absolute top-3 right-3 z-[400] bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-gray-200 shadow-md text-[11px] font-semibold text-gray-700 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          <span>{geoError}</span>
        </div>
      )}
    </div>
  );
}
