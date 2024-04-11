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
    const [color, setColor] = useState("red");
    const [mbd, setMbd] = useState();
    const mapRef = useRef<MapRef>();

    useEffect(() => {
        console.log(features);
    }, [features]);

    const onMapLoad = () => {
        mapRef.current
            .loadImage(
                "https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Cat_silhouette.svg/64px-Cat_silhouette.svg.png"
            )
            .then((response) =>
                mapRef.current.addImage("pattern", response.data)
            );
    };

    const onUpdate = useCallback(
        (e) => {
            console.log(color);

            setFeatures((currFeatures) => {
                const newFeatures = { ...currFeatures };
                for (const f of e.features) {
                    newFeatures[f.id] = f;
                }
                return newFeatures;
            });
        },
        [color]
    );

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
                userProperties={true}
                styles={[
                    // ACTIVE (being drawn)
                    // line stroke
                    {
                        id: "gl-draw-line",
                        type: "line",
                        filter: [
                            "all",
                            ["==", "$type", "LineString"],
                            ["==", "active", "true"],
                        ],
                        layout: {
                            "line-cap": "round",
                            "line-join": "round",
                        },
                        paint: {
                            "line-color": "#D20C0C",
                            "line-dasharray": [0.2, 2],
                            "line-width": 2,
                        },
                    },
                    // polygon fill
                    {
                        id: "gl-draw-polygon-fill",
                        type: "fill",
                        filter: [
                            "all",
                            ["==", "$type", "Polygon"],
                            ["==", "active", "true"],
                        ],
                        paint: {
                            "fill-color": "#D20C0C",
                            "fill-outline-color": "#D20C0C",
                            "fill-opacity": 0.1,
                        },
                    },
                    // polygon mid points
                    {
                        id: "gl-draw-polygon-midpoint",
                        type: "circle",
                        filter: [
                            "all",
                            ["==", "$type", "Point"],
                            ["==", "meta", "midpoint"],
                        ],
                        paint: {
                            "circle-radius": 3,
                            "circle-color": "#fbb03b",
                        },
                    },
                    // polygon outline stroke
                    // This doesn't style the first edge of the polygon, which uses the line stroke styling instead
                    {
                        id: "gl-draw-polygon-stroke-active",
                        type: "line",
                        filter: [
                            "all",
                            ["==", "$type", "Polygon"],
                            ["==", "active", "true"],
                        ],
                        layout: {
                            "line-cap": "round",
                            "line-join": "round",
                        },
                        paint: {
                            "line-color": "#D20C0C",
                            "line-dasharray": [0.2, 2],
                            "line-width": 2,
                        },
                    },
                    // vertex point halos
                    {
                        id: "gl-draw-polygon-and-line-vertex-halo-active",
                        type: "circle",
                        filter: [
                            "all",
                            ["==", "meta", "vertex"],
                            ["==", "$type", "Point"],
                            ["!=", "mode", "static"],
                        ],
                        paint: {
                            "circle-radius": 5,
                            "circle-color": "#FFF",
                        },
                    },
                    // vertex points
                    {
                        id: "gl-draw-polygon-and-line-vertex-active",
                        type: "circle",
                        filter: [
                            "all",
                            ["==", "meta", "vertex"],
                            ["==", "$type", "Point"],
                            ["!=", "mode", "static"],
                        ],
                        paint: {
                            "circle-radius": 3,
                            "circle-color": "#D20C0C",
                        },
                    },

                    // INACTIVE (static, already drawn)
                    // line stroke
                    {
                        id: "gl-draw-line-static",
                        type: "line",
                        filter: [
                            "all",
                            ["==", "$type", "LineString"],
                            ["==", "active", "false"],
                        ],
                        layout: {
                            "line-cap": "round",
                            "line-join": "round",
                        },
                        paint: {
                            "line-color": "#000",
                            "line-width": 3,
                        },
                    },
                    // polygon fill
                    {
                        id: "gl-draw-polygon-fill-static",
                        type: "fill",
                        filter: [
                            "all",
                            ["==", "$type", "Polygon"],
                            ["==", "active", "false"],
                        ],
                        paint: {
                            "fill-color": "#000",
                            "fill-outline-color": "#000",
                            "fill-opacity": 0.1,
                        },
                    },
                    {
                        id: "gl-draw-polygon-fill-blue-static",
                        type: "fill",
                        filter: [
                            "all",
                            ["==", "$type", "Polygon"],
                            ["==", "active", "false"],
                            ["==", "user_someshit", "red"],
                        ],
                        paint: {
                            "fill-color": "blue",
                            "fill-outline-color": "#000",
                            "fill-opacity": 0.1,
                        },
                    },
                    // polygon outline
                    {
                        id: "gl-draw-polygon-stroke-static",
                        type: "line",
                        filter: [
                            "all",
                            ["==", "$type", "Polygon"],
                            ["==", "active", "false"],
                        ],
                        layout: {
                            "line-cap": "round",
                            "line-join": "round",
                        },
                        paint: {
                            "line-color": "#000",
                            "line-width": 3,
                        },
                    },
                ]}
                defaultMode="draw_polygon"
                onCreate={onUpdate}
                onUpdate={onUpdate}
                onDelete={onDelete}
            />
            <Dropdown
                onChange={(e) => {
                    setColor(e.target.value);
                }}
            />
            <ScaleControl />
        </Map>
    );
};

const rootElement = document.getElementById("root");
ReactDOM.createRoot(rootElement).render(<App />);
