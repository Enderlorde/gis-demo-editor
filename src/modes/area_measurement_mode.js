import * as CommonSelectors from "../lib/common_selectors.js";
import doubleClickZoom from "../lib/double_click_zoom.js";
import { constants as Constants } from "@mapbox/mapbox-gl-draw";
import isEventAtCoordinates from "../lib/is_event_at_coordinates.js";
import createVertex from "../lib/create_vertex.js";

import * as _ from "lodash";
import lineToPolygon from "@turf/line-to-polygon";

import distance from "@turf/distance";
import area from "@turf/area";
import length from "@turf/length";

const DrawArea = {
    onSetup() {
        const line = this.newFeature({
            type: Constants.geojsonTypes.FEATURE,
            properties: {},
            geometry: {
                type: Constants.geojsonTypes.LINE_STRING,
                coordinates: [[]],
            },
        });
        const polygon = {};

        this.addFeature(line);

        this.clearSelectedFeatures();
        doubleClickZoom.disable(this);
        this.updateUIClasses({ mouse: Constants.cursors.ADD });

        this.activateUIButton(Constants.types.POLYGON);
        this.setActionableState({
            trash: true,
            combineFeatures: false,
            uncombineFeatures: false,
        });

        return {
            line,
            polygon,
            currentVertexPosition: 0,
            mode: "line",
        };
    },

    clickAnywhere(state, e) {
        /* if (
            state.currentVertexPosition > 0 &&
            isEventAtCoordinates(
                e,
                state.line.coordinates[state.currentVertexPosition - 1]
            )
        ) {
            return this.changeMode(Constants.modes.SIMPLE_SELECT, {
                featureIds: [state.line.id],
            });
        } */
        /* this.updateUIClasses({ mouse: Constants.cursors.ADD }); */
        if (state.mode === "line") {
            console.log(state.line);
            if (state.line) {
                state.line.updateCoordinate(
                    state.currentVertexPosition.toString(),
                    e.lngLat.lng,
                    e.lngLat.lat
                );
                state.currentVertexPosition++;
                state.line.updateCoordinate(
                    state.currentVertexPosition.toString(),
                    e.lngLat.lng,
                    e.lngLat.lat
                );
            } else {
                state.line = this.newFeature({
                    type: Constants.geojsonTypes.FEATURE,
                    properties: {},
                    geometry: {
                        type: Constants.geojsonTypes.LINE_STRING,
                        coordinates: [[]],
                    },
                });

                this.addFeature(line);
            }
        } else {
            this.deleteFeature([state.polygon.id], { silent: true });
            state.mode = "line";
        }
    },

    clickOnVertex(state, e) {
        //Если выбранная вершина совпадает с начальной замыкаем линию и преобразуем ее в полигон, после вычисляем его площадь и периметр
        if (
            state.mode === "line" &&
            state.currentVertexPosition > 2 &&
            state.line
        ) {
            if ("0" === e.featureTarget.properties.coord_path) {
                state.mode = "polygon";
                state.line.updateCoordinate(
                    state.currentVertexPosition.toString(),
                    state.line.coordinates[0][0],
                    state.line.coordinates[0][1]
                );
                const polygon = lineToPolygon(state.line);
                state.polygon = this.newFeature({
                    ...polygon,
                    properties: {
                        area: `${area(polygon)} m2`,
                        length: `${length(state.line)} m`,
                    },
                });
                this.deleteFeature([state.line.id], { silent: true });
                state.line = undefined;
                state.currentVertexPosition = 0;
                this.addFeature(state.polygon);
            }
        }
    },

    onMouseMove(state, e) {
        if (state.mode === "line" && state.line) {
            state.line.updateCoordinate(
                state.currentVertexPosition.toString(),
                e.lngLat.lng,
                e.lngLat.lat
            );

            if (state.currentVertexPosition > 0)
                state.line.properties["distance"] = distance(
                    state.line.coordinates[state.currentVertexPosition - 1],
                    state.line.coordinates[state.currentVertexPosition]
                );
            if (CommonSelectors.isVertex(e)) {
                e.target.getCanvas().style.cursor = "pointer";
            } else {
                e.target.getCanvas().style.cursor = "crosshair";
            }
        }
    },

    onClick(state, e) {
        if (CommonSelectors.isVertex(e) && state.currentVertexPosition > 0)
            return this.clickOnVertex(state, e);
        return this.clickAnywhere(state, e);
    },

    onKeyUp(state, e) {
        if (CommonSelectors.isEscapeKey(e)) {
            if (state.mode === "line") {
                this.deleteFeature([state.line.id], { silent: true });
            } else {
                this.deleteFeature([state.polygon.id], { silent: true });
            }
            this.changeMode(Constants.modes.SIMPLE_SELECT);
        } else if (CommonSelectors.isEnterKey(e)) {
            this.changeMode(Constants.modes.SIMPLE_SELECT);
        }
    },

    onStop(state) {
        /* this.updateUIClasses({ mouse: Constants.cursors.NONE }); */
        doubleClickZoom.enable(this);
        this.activateUIButton();

        //remove last added coordinate

        if (state.mode === "line") {
            state.line.removeCoordinate(state.currentVertexPosition.toString());
            this.deleteFeature([state.line.id], { silent: true });
        } else {
            this.deleteFeature([state.polygon.id], { silent: true });
        }

        /* this.changeMode(Constants.modes.SIMPLE_SELECT); */
    },

    toDisplayFeatures(state, geojson, display) {
        if (state.mode === "line") {
            const isActiveLine = geojson.properties.id === state.line.id;

            geojson.properties.active = isActiveLine
                ? Constants.activeStates.ACTIVE
                : Constants.activeStates.INACTIVE;
            if (!isActiveLine) return display(geojson);
        }
        if (state.mode === "polygon") {
            const isActivePolygon = geojson.properties.id === state.polygon.id;

            geojson.properties.active = isActivePolygon
                ? Constants.activeStates.ACTIVE
                : Constants.activeStates.INACTIVE;
            if (!isActivePolygon) return display(geojson);
        }
        /*  display(
            createVertex(
                state.line.id,
                geojson.geometry.coordinates[state.currentVertexPosition]
            )
        ); */
        //Создаем точку в начале линии
        if (state.mode !== "polygon") {
            display(
                createVertex(
                    state.line.id,
                    geojson.geometry.coordinates[0],
                    "0"
                )
            );
        }
        if (state.mode === "polygon") {
            display(
                createVertex(
                    state.polygon.id,
                    geojson.geometry.coordinates[0][0],
                    "0",
                    false,
                    { length: state.polygon.properties["length"] }
                )
            );
        }
        /* if (coordinateCount > 3) {
            // Add a start position marker to the map, clicking on this will finish the feature
            // This should only be shown when we're in a valid spot
            const endPos = geojson.geometry.coordinates.length - 3;
            display(
                createVertex(
                    state.line.id,
                    geojson.geometry.coordinates[endPos],
                    `0.${endPos}`,
                    false
                )
            );
        } */
        /* if (coordinateCount <= 4) {
            // If we've only drawn two positions (plus the closer),
            // make a LineString instead of a Polygon
            const lineCoordinates = [
                [
                    geojson.geometry.coordinates[0][0],
                    geojson.geometry.coordinates[0][1],
                ],
                [
                    geojson.geometry.coordinates[1][0],
                    geojson.geometry.coordinates[1][1],
                ],
            ];
            // create an initial vertex so that we can track the first point on mobile devices
            display({
                type: Constants.geojsonTypes.FEATURE,
                properties: geojson.properties,
                geometry: {
                    coordinates: lineCoordinates,
                    type: Constants.geojsonTypes.LINE_STRING,
                },
            });
            if (coordinateCount === 3) {
                return;
            }
        } */
        // render the Polygon
        display(geojson);
    },

    onTrash(state) {
        this.deleteFeature([state.line.id], { silent: true });
        this.deleteFeature([state.polygon.id], { silent: true });
        this.changeMode(Constants.modes.SIMPLE_SELECT);
    },
};

export default DrawArea;
