import * as React from "react";
import { useState, useCallback, useRef, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { Map, ScaleControl } from "react-map-gl/maplibre";
import type { MapRef } from "react-map-gl/maplibre";

import RadiusMode from "./radius-mode.ts";

import Dropdown from "./components/dropdown/dropdown.tsx";

import "maplibre-gl/dist/maplibre-gl.css";
import "mapbox-gl/dist/mapbox-gl.css";

import DrawControl from "./components/draw-control/draw-control.ts";
import MapboxDraw from "@mapbox/mapbox-gl-draw";

import LineStringAssisted from "./modes/LineStringAssisted.ts";

const App = () => {
    const [features, setFeatures] = useState({});
    const [currPolygon, setCurrPolygon] = useState({});
    const [color, setColor] = useState();
    const mapRef = useRef<MapRef>();
    const ref = useRef(color);

    useEffect(() => {
        console.log(features);
    }, [features]);

    useEffect(() => {
        console.log(color);
        ref.current = color;
    }, [color]);

    const onMapLoad = () => {
        mapRef.current
            .loadImage(
                "https://maplibre.org/maplibre-gl-js/docs/assets/popup.png"
            )
            .then((response) =>
                mapRef.current.addImage("popup", response.data, {
                    stretchX: [
                        [25, 55],
                        [85, 115],
                    ],
                    stretchY: [[25, 100]],
                    content: [25, 25, 115, 100],
                    pixelRatio: 2,
                })
            );
        mapRef.current
            .loadImage("./static/45.png")
            .then((response) => mapRef.current.addImage("45", response.data));
        mapRef.current
            .loadImage("./static/argyle.png")
            .then((response) =>
                mapRef.current.addImage("argyle", response.data)
            );
        mapRef.current
            .loadImage("./static/carbon.png")
            .then((response) =>
                mapRef.current.addImage("carbon", response.data)
            );
        mapRef.current
            .loadImage("./static/tile.png")
            .then((response) => mapRef.current.addImage("tile", response.data));
    };

    const onUpdate = useCallback((e, mbd) => {
        console.log(e);

        mbd.setFeatureProperty(e.features[0].id, "fill", ref.current);

        setFeatures((currFeatures) => {
            const newFeatures = { ...currFeatures };
            for (const f of e.features) {
                newFeatures[f.id] = f;
            }
            return newFeatures;
        });
    }, []);

    const onDelete = useCallback((e) => {
        setFeatures((currFeatures) => {
            const newFeatures = { ...currFeatures };
            for (const f of e.features) {
                delete newFeatures[f.id];
            }
            return newFeatures;
        });
    }, []);

    const modeChangeHandler = useCallback((e, mbd: MapboxDraw) => {
        console.log(mbd.getMode());
        //mbd.changeMode("draw_assisted_line_string");
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
                        source: "osmRaster",
                    },
                ],
                glyphs: "https://tiles.versatiles.org/assets/fonts/{fontstack}/{range}.pbf",
                sources: {
                    osmRaster: {
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
                    combine_features: true,
                    uncombine_features: true,
                }}
                userProperties={true}
                styles={[
                    {
                        id: "gl-draw-point-lable",
                        type: "symbol",
                        filter: [
                            "all",
                            ["==", "$type", "Point"],
                            [
                                "any",
                                ["has", "distance"],
                                ["has", "user_distance"],
                            ],
                        ],
                        layout: {
                            "text-field": [
                                "coalesce",
                                ["get", "user_distance"],
                                ["get", "distance"],
                            ],
                            "text-font": ["noto_sans_regular"],
                            "text-offset": [0, -2],
                            "text-anchor": "bottom",
                            "text-allow-overlap": true,
                            "icon-image": "popup",
                            "icon-allow-overlap": true,
                            "icon-anchor": "bottom",
                            "icon-text-fit": "both",
                            "symbol-z-order": "viewport-y",
                        },
                        paint: {
                            "text-halo-color": "#ffffff",
                            "text-halo-width": 2,
                            "icon-halo-color": "#000000",
                            "icon-halo-width": 2,
                            "icon-halo-blur": 5,
                            "icon-opacity": 0.5,
                        },
                    },
                    {
                        id: "gl-draw-point-length",
                        type: "symbol",
                        filter: [
                            "all",
                            ["==", "$type", "Point"],
                            ["has", "length"],
                        ],
                        layout: {
                            "text-field": ["get", "length"],
                            "text-font": ["noto_sans_regular"],
                            "text-offset": [0, -1],
                            "text-anchor": "bottom",
                            "text-allow-overlap": true,
                            "icon-image": "popup",
                            "icon-allow-overlap": true,
                            "icon-anchor": "bottom",
                            "icon-text-fit": "both",
                            "symbol-z-order": "viewport-y",
                        },
                        paint: {
                            "text-halo-color": "#ffffff",
                            "text-halo-width": 2,
                            "icon-halo-color": "#000000",
                            "icon-halo-width": 2,
                            "icon-halo-blur": 5,
                            "icon-opacity": 0.5,
                        },
                    },
                    {
                        id: "gl-draw-point",
                        type: "circle",
                        filter: ["all", ["==", "$type", "Point"]],
                        paint: {
                            "circle-radius": 3,
                            "circle-color": "#000",
                        },
                    },
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
                        id: "gl-draw-polygon-fill-color-static",
                        type: "fill",
                        filter: [
                            "all",
                            ["==", "$type", "Polygon"],
                            ["==", "active", "false"],
                            ["has", "user_fill"],
                        ],
                        paint: {
                            "fill-pattern": ["get", "user_fill"],
                            "fill-outline-color": "#000",
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
                modes={{
                    ...MapboxDraw.modes,
                    ["draw_assisted_line_string"]: LineStringAssisted,
                }}
                defaultMode="draw_assisted_line_string"
                onCreate={onUpdate}
                onUpdate={onUpdate}
                onDelete={onDelete}
                onModeChange={modeChangeHandler}
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
