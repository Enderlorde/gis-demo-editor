import MapboxDraw, {
    DrawCustomMode,
    DrawCustomModeThis,
    DrawFeature,
    DrawLineString,
    constants,
} from "@mapbox/mapbox-gl-draw";
import type { Point, Feature, Position } from "geojson";
import { MapMouseEvent } from "@mapbox/mapbox-gl-draw";
import { MapGeoJSONFeature } from "react-map-gl";
import { Coordinates } from "maplibre-gl";

type featureOptions = {
    featureID?: string;
    from?: Feature<Point> | Point | number[];
};

type State = {
    line?: DrawLineString;
    currentVertexPosition?: number;
    direction?: string;
};

type LineStringAssistedMode =
    | (DrawCustomMode & {
          clickAnywhere(
              state: State,
              evt: MapMouseEvent
          ): FunctionStringCallback;
          clickOnVertex(
              state: State,
              evt: MapMouseEvent
          ): FunctionStringCallback;
      })
    | (DrawCustomModeThis & {
          clickAnywhere(
              state: State,
              evt: MapMouseEvent
          ): FunctionStringCallback;
          clickOnVertex(
              state: State,
              evt: MapMouseEvent
          ): FunctionStringCallback;
      });

const isEventAtCoordinates = (evt: MapMouseEvent, coordinates: number[]) => {
    if (!evt.lngLat) return false;
    return (
        evt.lngLat.lng === coordinates[0] && evt.lngLat.lat === coordinates[1]
    );
};

const isVertex = (e): boolean => {
    const featureTarget = e.target.getFe;
    if (!featureTarget) return false;
    if (!featureTarget.properties) return false;
    return featureTarget.properties.meta === constants.meta.VERTEX;
};

const isEnterKey = (e: KeyboardEvent): boolean => {
    return e.keyCode === 13;
};

const isEscapeKey = (e: KeyboardEvent): boolean => {
    return e.keyCode === 27;
};

const createVertex = (
    parentId: string,
    coordinates: Position,
    path: string,
    selected: any
) => {
    return {
        type: constants.geojsonTypes.FEATURE,
        properties: {
            meta: constants.meta.VERTEX,
            parent: parentId,
            coord_path: path,
            active: selected
                ? constants.activeStates.ACTIVE
                : constants.activeStates.INACTIVE,
        },
        geometry: {
            type: constants.geojsonTypes.POINT,
            coordinates,
        },
    };
};

const LineStringAssistedMode: LineStringAssistedMode = {
    //Triggered when a mode is selected
    //
    onSetup(options: featureOptions): State {
        options = options || <featureOptions>{};
        const featureID: string = options.featureID;

        let line: DrawLineString, currentVertexPosition;
        let direction: string = "forward";

        //if ID presented, line is going to modify
        if (featureID) {
            line = <DrawLineString>this.getFeature(featureID);

            if (!line) {
                throw new Error("Не могу найти feature с таким ID");
            }

            let from = options.from;
            if (
                from &&
                "type" in from &&
                from.type === "Feature" &&
                "geometry" in from &&
                from.geometry.type === "Point"
            ) {
                from = from.geometry;
            }
            if (
                from &&
                "type" in from &&
                from.type === "Point" &&
                "coordinates" in from &&
                from.coordinates.length === 2
            ) {
                from = from.coordinates;
            }
            if (!from || !Array.isArray(from)) {
                throw new Error(
                    "Пожалуйста, используйте свойство `from` для определения из какой точки продолжается линия"
                );
            }

            const lastCoord = line.coordinates.length - 1;
            // If selected last vertex of line then continue adding points forward
            if (
                line.coordinates[lastCoord][0] === from[0] &&
                line.coordinates[lastCoord][1] === from[1]
            ) {
                currentVertexPosition = lastCoord + 1;
                line.addCoordinate(
                    currentVertexPosition,
                    line.coordinates[lastCoord][0],
                    line.coordinates[lastCoord][1]
                );
            }
            // If selected first vertex of line then continue adding points backward
            else if (
                line.coordinates[0][0] === from[0] &&
                line.coordinates[0][1] === from[1]
            ) {
                direction = "backward";
                currentVertexPosition = 0;
                line.addCoordinate(
                    currentVertexPosition,
                    line.coordinates[0][0],
                    line.coordinates[0][1]
                );
            } else {
                throw new Error(
                    "`from` должен совпадать с точкой в конце или начале линии"
                );
            }
            //If ID not provided then adding new line
        } else {
            line = <DrawLineString>this.newFeature({
                type: constants.geojsonTypes.FEATURE,
                properties: {},
                geometry: {
                    type: constants.geojsonTypes.LINE_STRING,
                    coordinates: [],
                },
            });
            currentVertexPosition = 0;
            this.addFeature(line);
        }

        this.clearSelectedFeatures();
        this.updateUIClasses({
            mouse: constants.cursors.ADD,
        });
        this.activateUIButton(constants.types.LINE);
        this.setActionableState({
            trash: true,
            combineFeatures: false,
            uncombineFeatures: false,
        });

        return {
            line,
            currentVertexPosition,
            direction,
        };
    },

    clickAnywhere(state, evt) {
        if (
            (state.currentVertexPosition > 0 &&
                isEventAtCoordinates(
                    evt,
                    state.line.coordinates[state.currentVertexPosition - 1]
                )) ||
            (state.direction === "backwards" &&
                isEventAtCoordinates(
                    evt,
                    state.line.coordinates[state.currentVertexPosition + 1]
                ))
        ) {
            return this.changeMode(constants.modes.SIMPLE_SELECT, {
                featureIds: [state.line.id],
            });
        }

        this.updateUIClasses({ mouse: constants.cursors.ADD });
        state.line.updateCoordinate(
            state.currentVertexPosition.toString(),
            evt.lngLat.lng,
            evt.lngLat.lat
        );
        if (state.direction === "forward") {
            state.currentVertexPosition++;
            state.line.updateCoordinate(
                state.currentVertexPosition.toString(),
                evt.lngLat.lng,
                evt.lngLat.lat
            );
        } else {
            state.line.addCoordinate("0", evt.lngLat.lng, evt.lngLat.lat);
        }
    },

    clickOnVertex(state, evt) {
        return this.changeMode(constants.modes.SIMPLE_SELECT, {
            featureIds: state.line.id,
        });
    },

    onMouseMove(state: State, evt) {
        state.line.updateCoordinate(
            state.currentVertexPosition.toString(),
            evt.lngLat.lng,
            evt.lngLat.lat
        );
        if (isVertex(evt)) {
            this.updateUIClasses({ mouse: constants.cursors.POINTER });
        }
    },

    onClick(state: State, evt: MapMouseEvent) {
        console.log("8=======================================э");

        if (isVertex(evt)) return this.clickOnVertex(state, evt);
        this.clickAnywhere(state, evt);
    },

    onKeyUp(state: State, evt) {
        if (isEnterKey(evt)) {
            this.changeMode(constants.modes.SIMPLE_SELECT, {
                featureIds: [state.line.id],
            });
        } else if (isEscapeKey(evt)) {
            if (state.line.id) {
                this.deleteFeature(state.line.id.toString(), { silent: true });
            }
            this.changeMode(constants.modes.SIMPLE_SELECT);
        }
    },

    onStop(state: State) {
        this.activateUIButton();
        if (this.getFeature(state.line.id.toString()) === undefined) return;

        state.line.removeCoordinate(`${state.currentVertexPosition}`);

        if (state.line.isValid()) {
            this.map.fire(constants.events.CREATE, {
                features: [state.line.toGeoJSON()],
            });
        } else {
            this.deleteFeature(state.line.id.toString(), { silent: true });
            this.changeMode(
                constants.modes.SIMPLE_SELECT,
                {},
                { silent: true }
            );
        }
    },

    onTrash(state: State) {
        this.deleteFeature(state.line.id.toString(), { silent: true });
        this.changeMode(constants.modes.SIMPLE_SELECT);
    },

    toDisplayFeatures(
        state: State,
        geojson: MapGeoJSONFeature & { geometry: { coordinates: Coordinates } },
        display
    ) {
        const isActiveLine = geojson.properties.id == state.line.id;
        geojson.properties.active = isActiveLine
            ? constants.activeStates.ACTIVE
            : constants.activeStates.INACTIVE;

        if (!isActiveLine) return display(geojson);
        if (geojson.geometry.coordinates.length < 2) return;
        geojson.properties.meta = constants.meta.FEATURE;
        display(
            createVertex(
                state.line.id.toString(),
                geojson.geometry.coordinates[
                    state.direction === "forward"
                        ? geojson.geometry.coordinates.length - 2
                        : 1
                ],
                `${
                    state.direction === "forward"
                        ? geojson.geometry.coordinates.length - 2
                        : 1
                }`,
                false
            )
        );

        display(geojson);
    },
};

export default LineStringAssistedMode;
