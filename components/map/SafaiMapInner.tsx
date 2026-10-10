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
import { Plus, Minus } from "lucide-react";
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
  wasteType?: string;
  address?: string;
  volunteersNeeded?: number;
  distance?: string;
  image?: string;
  completedImage?: string;
  markedBy?: MarkedByUser | string;
  markedAt?: string;
  isCompleted?: boolean;
  isPendingVerification?: boolean;
  verificationStatus?: string | null;
  oneTimeVerificationId?: string | null;
  pendingVerificationMsg?: string;
  pendingCleanupImage?: string;
  isAssignedBy?: any[];
  isCompletedBy?: any[];
  critcal?: string;
  isAiVerified?: {
    isAiOrEdited?: boolean;
    forensicConfidence?: number;
    detectedManipulationType?: string;
    forensicDetails?: string;
    gestureMatched?: boolean;
    detectedGestureName?: string;
    detectedCode?: string;
    isValidWasteReport?: boolean;
    isFraudulent?: boolean;
    fraudReason?: string;
    summary?: string;
    auditResult?: any;
    verifiedBy?: string;
    verifiedAt?: string;
    [key: string]: any;
  } | null;
  isVerified?: boolean;
  isCompletedVerify?: "pending" | "completed" | "uncompleted" | string;
  isCompletedVerifyAt?: string;
  hasUserReported?: boolean;
  isReportedByRequestedUser?: boolean;
  isReported?: boolean;
  isReportedBy?: any[];
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
  isDirectionsPopupOpen?: boolean;
  onToggleDirectionsPopup?: (open?: boolean) => void;
  onRouteSummaryChange?: (summary: { timeStr: string; distKm: string; roadName: string } | null) => void;
  userLocation?: [number, number] | null;
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

// Selected Pin Drop Marker Icon (Locked Current Location Pin)
const dropPinIcon = L.divIcon({
  html: `
    <div class="flex items-center justify-center animate-bounce">
      <div class="relative w-11 h-11 bg-[#006948] rounded-full flex items-center justify-center text-white shadow-xl border-2 border-white">
        <span class="material-symbols-outlined text-[20px]">my_location</span>
        <span class="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border border-white flex items-center justify-center text-[10px] text-white">
          <span class="material-symbols-outlined text-[10px]">lock</span>
        </span>
      </div>
    </div>
  `,
  className: "custom-drop-pin !bg-transparent !border-0",
  iconSize: [44, 44],
  iconAnchor: [22, 22],
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
function MapController({ center }: { center?: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (center && center.length === 2 && !isNaN(center[0]) && !isNaN(center[1])) {
      map.flyTo(center, Math.max(map.getZoom(), 16), { animate: true, duration: 0.8 });
    }
  }, [center, map]);
  return null;
}

// Custom Apple/Uber styled Zoom Controller matching the Locate Button
function CustomZoomControl() {
  const map = useMap();

  return (
    <div className="leaflet-bottom leaflet-left !pointer-events-auto !z-[800] !bottom-[84px] !left-4">
      <div className="flex flex-col bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl shadow-[0_10px_25px_rgba(15,23,42,0.14)] overflow-hidden">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (typeof window !== "undefined" && "navigator" in window && "vibrate" in navigator) {
              try {
                navigator.vibrate(25);
              } catch (_) {}
            }
            map.zoomIn();
          }}
          aria-label="Zoom In"
          title="Zoom In"
          className="w-11 h-11 flex items-center justify-center text-[#006948] hover:bg-emerald-50/80 active:scale-95 transition-all cursor-pointer border-b border-slate-100 group"
        >
          <Plus className="w-5 h-5 group-hover:scale-110 transition-transform stroke-[2.5]" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (typeof window !== "undefined" && "navigator" in window && "vibrate" in navigator) {
              try {
                navigator.vibrate(25);
              } catch (_) {}
            }
            map.zoomOut();
          }}
          aria-label="Zoom Out"
          title="Zoom Out"
          className="w-11 h-11 flex items-center justify-center text-[#006948] hover:bg-emerald-50/80 active:scale-95 transition-all cursor-pointer group"
        >
          <Minus className="w-5 h-5 group-hover:scale-110 transition-transform stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
}

// Component to handle turn-by-turn routing using leaflet-routing-machine
function RoutingControl({
  userLocation,
  destination,
  onClearRouting,
  isDirectionsPopupOpen,
  onToggleDirectionsPopup,
  onRouteSummaryChange,
}: {
  userLocation: [number, number];
  destination: [number, number];
  onClearRouting?: () => void;
  isDirectionsPopupOpen?: boolean;
  onToggleDirectionsPopup?: (open?: boolean) => void;
  onRouteSummaryChange?: (summary: { timeStr: string; distKm: string; roadName: string } | null) => void;
}) {
  const map = useMap();

  const userLat = userLocation?.[0];
  const userLng = userLocation?.[1];
  const destLat = destination?.[0];
  const destLng = destination?.[1];

  const onClearRef = React.useRef(onClearRouting);
  const onToggleDirectionsPopupRef = React.useRef(onToggleDirectionsPopup);
  const onRouteSummaryChangeRef = React.useRef(onRouteSummaryChange);
  const routingControlRef = React.useRef<any>(null);

  useEffect(() => {
    onClearRef.current = onClearRouting;
  }, [onClearRouting]);

  useEffect(() => {
    onToggleDirectionsPopupRef.current = onToggleDirectionsPopup;
  }, [onToggleDirectionsPopup]);

  useEffect(() => {
    onRouteSummaryChangeRef.current = onRouteSummaryChange;
  }, [onRouteSummaryChange]);

  // Sync popup visibility state with leaflet-routing-container
  useEffect(() => {
    const container = routingControlRef.current?.getContainer?.();
    if (!container) return;
    if (isDirectionsPopupOpen) {
      container.classList.remove("gmaps-popup-hidden");
      container.classList.add("gmaps-popup-visible");
    } else {
      container.classList.remove("gmaps-popup-visible");
      container.classList.add("gmaps-popup-hidden");
    }
  }, [isDirectionsPopupOpen]);

  // Dynamic waypoint update when current geo location or destination changes
  useEffect(() => {
    if (!routingControlRef.current) return;
    if (
      userLat === undefined ||
      userLng === undefined ||
      destLat === undefined ||
      destLng === undefined
    ) {
      return;
    }

    try {
      routingControlRef.current.setWaypoints([
        L.latLng(userLat, userLng),
        L.latLng(destLat, destLng),
      ]);
    } catch (err) {
      console.warn("Could not dynamically update routing waypoints:", err);
    }
  }, [userLat, userLng, destLat, destLng]);

  // Initial Routing Control Setup
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
      // Create Routing machine control on map with Google Maps styled polylines
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
          styles: [
            { color: "#185abc", weight: 7, opacity: 0.85 },
            { color: "#4285f4", weight: 5, opacity: 1 },
          ],
          extendToWaypoints: true,
          missingRouteTolerance: 0,
        },
      }).addTo(map);

      routingControlRef.current = routingControl;

      // Inject Google Maps styled Header and Footer into leaflet-routing-machine container
      const container = routingControl.getContainer();
      if (container) {
        // Set initial popup visibility
        if (isDirectionsPopupOpen) {
          container.classList.add("gmaps-popup-visible");
          container.classList.remove("gmaps-popup-hidden");
        } else {
          container.classList.add("gmaps-popup-hidden");
          container.classList.remove("gmaps-popup-visible");
        }

        // 1. Google Maps Navigation Header (with close popup toggle)
        const headerEl = document.createElement("div");
        headerEl.className = "gmaps-nav-header";
        headerEl.innerHTML = `
          <div class="gmaps-nav-header-left">
            <div class="gmaps-nav-icon-badge">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
              </svg>
            </div>
            <div class="gmaps-nav-text-col">
              <span class="gmaps-nav-badge">NAVIGATION ACTIVE</span>
              <span class="gmaps-nav-title">Google Maps Directions</span>
            </div>
          </div>
          <button type="button" class="gmaps-nav-close-btn" title="Close directions panel" aria-label="Close directions panel">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        `;
        const closeBtn = headerEl.querySelector(".gmaps-nav-close-btn");
        if (closeBtn) {
          closeBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            onToggleDirectionsPopupRef.current?.(false);
          });
        }
        container.insertBefore(headerEl, container.firstChild);

        // 2. Google Maps Navigation Bottom Exit Bar (exits navigation entirely)
        const footerEl = document.createElement("div");
        footerEl.className = "gmaps-nav-footer";
        footerEl.innerHTML = `
          <button type="button" class="gmaps-exit-pill-btn">
            <span class="gmaps-exit-icon">✕</span>
            <span>Exit Navigation</span>
          </button>
        `;
        const exitBtn = footerEl.querySelector(".gmaps-exit-pill-btn");
        if (exitBtn) {
          exitBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            onClearRef.current?.();
          });
        }
        container.appendChild(footerEl);
      }

      // Format Google Maps route summary when routes are computed
      routingControl.on("routesfound", (e: any) => {
        try {
          const route = e.routes?.[0];
          if (!route) return;
          const distKm = (route.summary.totalDistance / 1000).toFixed(1);
          const totalMins = Math.max(1, Math.round(route.summary.totalTime / 60));
          const timeStr = totalMins >= 60
            ? `${Math.floor(totalMins / 60)} hr ${totalMins % 60} min`
            : `${totalMins} min`;
          const rawRoadName = (route.name || "Main Road").trim();
          const cleanRoadName = rawRoadName.replace(/^via\s*/i, "");

          // Notify parent of updated route summary for the floating bar
          onRouteSummaryChangeRef.current?.({
            timeStr,
            distKm,
            roadName: cleanRoadName,
          });

          setTimeout(() => {
            const cont = routingControl.getContainer();
            if (!cont) return;

            // Enhance h3 into Google Maps ETA & distance hero
            const h3 = cont.querySelector(".leaflet-routing-alt h3");
            if (h3) {
              h3.innerHTML = `
                <div class="gmaps-summary-card">
                  <div class="gmaps-time-group">
                    <span class="gmaps-time-big">${timeStr}</span>
                    <span class="gmaps-dist-muted">(${distKm} km)</span>
                  </div>
                  <div class="gmaps-traffic-badge">
                    <span class="gmaps-traffic-dot"></span>
                    <span>Fastest route</span>
                  </div>
                </div>
              `;
            }

            // Enhance h2 road name with subtle road icon
            const h2 = cont.querySelector(".leaflet-routing-alt h2");
            if (h2 && !h2.querySelector(".gmaps-road-icon")) {
              h2.innerHTML = `
                <span class="gmaps-road-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M4 19L8 5M16 5l4 14M12 5v2m0 6v2m0 6v2"/>
                  </svg>
                </span>
                <span>via ${cleanRoadName}</span>
              `;
            }
          }, 30);
        } catch (err) {
          // fallback gracefully
        }
      });
    } catch (err) {
      console.warn("Could not initialize routing control:", err);
    }

    return () => {
      onRouteSummaryChangeRef.current?.(null);
      routingControlRef.current = null;
      if (!routingControl) return;

      try {
        const container = routingControl.getContainer?.();

        if (!routingControl._map) {
          routingControl._map = map;
        }

        if (routingControl._line && map) {
          try {
            if (typeof map.hasLayer === "function" && map.hasLayer(routingControl._line)) {
              map.removeLayer(routingControl._line);
            }
          } catch (e) {}
          routingControl._line = null;
        }

        try {
          if (routingControl.getPlan && typeof routingControl.getPlan === "function") {
            const plan = routingControl.getPlan();
            if (plan && typeof plan.setWaypoints === "function") {
              plan.setWaypoints([]);
            }
          }
        } catch (e) {}

        if (map && typeof map.removeControl === "function") {
          map.removeControl(routingControl);
        }

        if (container && container.parentNode) {
          container.parentNode.removeChild(container);
        }
      } catch (e) {}
    };
  }, [map]);

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
  isDirectionsPopupOpen,
  onToggleDirectionsPopup,
  onRouteSummaryChange,
  userLocation: propUserLocation,
}: SafaiMapInnerProps) {
  const [mapCenter, setMapCenter] = useState<[number, number]>(center);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(propUserLocation || null);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Sync external userLocation prop
  useEffect(() => {
    if (propUserLocation && propUserLocation.length === 2 && !isNaN(propUserLocation[0]) && !isNaN(propUserLocation[1])) {
      setUserLocation(propUserLocation);
    }
  }, [propUserLocation]);

  // Update mapCenter if parent provides/updates a center prop
  useEffect(() => {
    if (center && center.length === 2 && !isNaN(center[0]) && !isNaN(center[1])) {
      setMapCenter(center);
      if (!propUserLocation) {
        setUserLocation(center);
      }
    }
  }, [center, propUserLocation]);

  // Dynamic Geolocation upon mount and continuous live tracking
  useEffect(() => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) return;

    // Get initial position fix
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userCoords: [number, number] = [
          position.coords.latitude,
          position.coords.longitude,
        ];
        setUserLocation(userCoords);
        if (!center) setMapCenter(userCoords);
      },
      (error) => {
        console.warn("Geolocation initial fix error:", error.message);
        setGeoError("Using default city location (Delhi)");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );

    // Continuous watchPosition for live updates while user moves
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const liveCoords: [number, number] = [
          position.coords.latitude,
          position.coords.longitude,
        ];
        setUserLocation(liveCoords);
      },
      (error) => {
        console.warn("Geolocation watch error:", error.message);
      },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  return (
    <div className={`relative w-full h-full ${className || ""}`}>
      {/* Map Container */}
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        zoomControl={false}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
        style={{ width: "100%", height: "100%", minHeight: "350px" }}
      >
        <MapController center={mapCenter} />
        <CustomZoomControl />

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
            isDirectionsPopupOpen={isDirectionsPopupOpen}
            onToggleDirectionsPopup={onToggleDirectionsPopup}
            onRouteSummaryChange={onRouteSummaryChange}
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
        {reports.map((report, index) => (
          <Marker
            key={`${report.id}-${index}`}
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
