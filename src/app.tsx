import * as React from "react";
import { useState, useCallback, useRef, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { Map, ScaleControl } from "react-map-gl/maplibre";
import type { MapRef } from "react-map-gl/maplibre";

import Dropdown from "./components/dropdown/dropdown.tsx";

import "maplibre-gl/dist/maplibre-gl.css";
import "mapbox-gl/dist/mapbox-gl.css";

import DrawControl from "./components/draw-control/draw-control.ts";
const App = () => {
    const [features, setFeatures] = useState({});
    const mapRef = useRef<MapRef>();

    const onMapLoad = () => {
        mapRef.current
            .loadImage(
                "https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Cat_silhouette.svg/64px-Cat_silhouette.svg.png"
            )
            .then((response) =>
                mapRef.current.addImage("pattern", response.data)
            );
    };

    const onUpdate = useCallback((e) => {
        setFeatures((currFeatures) => {
            const newFeatures = { ...currFeatures };
            for (const f of e.features) {
                newFeatures[f.id] = f;
            }
            return newFeatures;
        });
    }, []);

    const onDelete = useCallback((e) => {
        console.log(e);

        setFeatures((currFeatures) => {
            const newFeatures = { ...currFeatures };
            for (const f of e.features) {
                delete newFeatures[f.id];
            }
            return newFeatures;
        });
    }, []);

    return (
        <Map
            onLoad={() => onMapLoad()}
            ref={mapRef}
            id="map"
            initialViewState={{
                longitude: 27.55874,
                latitude: 53.9012,
                zoom: 7,
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
                        attribution:
                            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                    },
                },
            }}
            maxBounds={[23.027, 51.161, 32.981, 56.292]}
        >
            <DrawControl
                position="top-left"
                displayControlsDefault={false}
                controls={{
                    point: true,
                    polygon: true,
                    line_string: true,
                    trash: true,
                }}
                defaultMode="draw_polygon"
                onCreate={onUpdate}
                onUpdate={onUpdate}
                onDelete={onDelete}
            />
            <Dropdown />
            <ScaleControl />
        </Map>
    );
};

const rootElement = document.getElementById("root");
ReactDOM.createRoot(rootElement).render(<App />);
