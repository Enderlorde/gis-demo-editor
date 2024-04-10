import * as React from "react";
import ReactDOM from "react-dom/client";
import { Map, AttributionControl, ScaleControl } from "react-map-gl/maplibre";
import { MapStyle } from "react-map-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const App = () => {
    return (
        <Map
            initialViewState={{
                longitude: -122.44,
                latitude: 37.8,
                zoom: 14,
            }}
            style={{
                width: 640,
                height: 480,
            }}
            mapStyle={{
                version: 8,
                name: "osm_map",
                layers: [
                    {
                        id: "baselayer",
                        type: "raster",
                        source: "osm_raster",
                    },
                ],
                sources: {
                    osm_raster: {
                        type: "raster",
                        tiles: [
                            "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
                        ],
                        tileSize: 256,
                    },
                },
            }}
            attributionControl={false}
        >
            <AttributionControl
                compact={true}
                customAttribution={`Map data from OSM`}
            />
            <ScaleControl />
        </Map>
    );
};

const rootElement = document.getElementById("root");
ReactDOM.createRoot(rootElement).render(<App />);
