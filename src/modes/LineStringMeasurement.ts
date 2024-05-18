import {
    DrawCustomMode,
    DrawLineString,
    DrawMultiFeature,
    constants,
} from "@mapbox/mapbox-gl-draw";
import type {
    Point,
    Feature,
    Position,
    FeatureCollection,
    GeoJsonObject,
    MultiLineString,
} from "geojson";
import { MapMouseEvent } from "@mapbox/mapbox-gl-draw";
import { MapGeoJSONFeature, MapboxGeoJSONFeature } from "react-map-gl";
import midpoint from "@turf/midpoint";
import length from "@turf/length";
import * as helpers from "@turf/helpers";
import { round } from "@turf/helpers";
import distance from "@turf/distance";

type featureOptions = {
    //ID линии
    featureId: string;
    //Крайняя точка, с которой необходимо продолжать линию
    from?: Feature<Point> | Point | number[];
};

type State = {
    line?: DrawLineString;
    currentVertexPosition?: number;
    direction?: string;
    vertexPositions?: MapboxDraw.DrawFeatureBase<Position[]>[];
    distance?: string;
};

const isEventAtCoordinates = (evt: MapMouseEvent, coordinates: Position) => {
    if (!evt.lngLat) return false;
    return (
        evt.lngLat.lng === coordinates[0] && evt.lngLat.lat === coordinates[1]
    );
};

const convertMeasure = (length) => {
    const measures = [
        { measure: "centimeters", name: "см" },
        { measure: "meters", name: "м" },
        { measure: "kilometers", name: "км" },
    ];

    const finalUnit = measures[length > 1 ? 2 : length > 0.001 ? 1 : 0];

    return `${round(
        helpers.convertLength(length, measures[2].measure, finalUnit.measure),
        2
    )} ${finalUnit.name}`;
};

const createMidpoints = (
    feature: MapboxDraw.DrawFeatureBase<Position[]>
): GeoJsonObject & MapGeoJSONFeature[] => {
    /* console.log(feature.coordinates); */
    if (feature.coordinates.length > 1) {
        let segments: number[][][] = [];

        for (let i = 0; i < feature.coordinates.length - 1; i++) {
            segments.push([feature.coordinates[i], feature.coordinates[i + 1]]);
        }
        let midpoints = <GeoJsonObject & MapGeoJSONFeature[]>[];
        segments.forEach((segment, i) => {
            const midpointFeature = <GeoJsonObject & MapGeoJSONFeature>(
                midpoint(segment[0], segment[1])
            );
            midpointFeature.properties["length"] = convertMeasure(
                distance(segment[0], segment[1])
            );
            midpoints.push(midpointFeature);
        });
        return midpoints;
    }
};

const isVertex = (e): boolean => {
    const featureTarget = e.featureTarget;
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
    distance: string
) => {
    return {
        type: constants.geojsonTypes.FEATURE,
        properties: {
            meta: constants.meta.FEATURE,
            parent: parentId,
            coord_path: path,
            active: constants.activeStates.INACTIVE,
            distance: distance,
        },
        geometry: {
            type: constants.geojsonTypes.POINT,
            coordinates: coordinates,
        },
    };
};

const LineStringAssistedMode: DrawCustomMode & {
    clickAnywhere?(state: State, evt: MapMouseEvent): void;
    clickOnVertex?(state: State, evt: MapMouseEvent): void;
} = {
    //Запускается когда режим выбран
    onSetup(options: featureOptions): State {
        options = options || <featureOptions>{};
        const featureId: string = options.featureId;

        let line: DrawLineString, currentVertexPosition, vertexPositions;
        let direction: string = "forward";
        let distance = "0";

        //Если из предыдущего режима передан featureId - продолжить рисование линии из точки from
        if (featureId) {
            line = <DrawLineString>this.getFeature(featureId);

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
            //Создаем пустой feature линии как только перешли в режим и предыдущий режим не передал options
            line = <DrawLineString>this.newFeature({
                type: constants.geojsonTypes.FEATURE,
                properties: {},
                geometry: {
                    type: constants.geojsonTypes.LINE_STRING,
                    coordinates: [],
                },
            });
            currentVertexPosition = 0;
            vertexPositions = [];
            this.addFeature(line);
        }

        this.clearSelectedFeatures();

        this.setActionableState({
            trash: true,
            combineFeatures: true,
            uncombineFeatures: true,
        });

        return {
            line,
            currentVertexPosition,
            direction,
            vertexPositions,
            distance,
        };
    },

    //Функция, которая вызывается по клику в любом месте кроме вершины
    clickAnywhere(state, evt) {
        //Выход из режима, если крайняя точка совпадает с начальной
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

        state.line.updateCoordinate(
            state.currentVertexPosition.toString(),
            evt.lngLat.lng,
            evt.lngLat.lat
        );
        if (
            state.direction === "forward" ||
            state.currentVertexPosition === 1
        ) {
            state.currentVertexPosition++;
            if (state.currentVertexPosition > 1) {
                state.vertexPositions.push(
                    this.newFeature({
                        type: constants.geojsonTypes.FEATURE,
                        properties: { distance: state.distance },
                        geometry: {
                            type: constants.geojsonTypes.POINT,
                            coordinates: [evt.lngLat.lng, evt.lngLat.lat],
                        },
                    })
                );
            }
            state.line.updateCoordinate(
                state.currentVertexPosition.toString(),
                evt.lngLat.lng,
                evt.lngLat.lat
            );
        } else {
            //????????????
            state.line.addCoordinate("0", evt.lngLat.lng, evt.lngLat.lat);
        }
    },

    //По нажатию на вершину выходим в режим SIMPLE_SELECT и передаем текущую линию как выделенную по умолчанию
    clickOnVertex(state, evt) {
        this.changeMode(constants.modes.SIMPLE_SELECT, {
            featureIds: [state.line.id],
        });
    },

    onMouseMove(state: State, evt) {
        state.line.updateCoordinate(
            state.currentVertexPosition.toString(),
            evt.lngLat.lng,
            evt.lngLat.lat
        );
        state.distance = convertMeasure(length(state.line));
        evt.target.getCanvas().style.cursor = "crosshair";
    },

    onClick(state: State, evt: MapMouseEvent) {
        evt.target.getCanvas().style.cursor = "default";
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
        if (this.getFeature(state.line.id.toString()) === undefined) return;

        state.line.removeCoordinate(`${state.currentVertexPosition}`);

        this.deleteFeature(state.line.id.toString(), { silent: true });
        this.changeMode(constants.modes.SIMPLE_SELECT, {}, { silent: true });
    },

    onTrash(state: State) {
        this.deleteFeature(state.line.id.toString(), { silent: true });
        this.changeMode(constants.modes.SIMPLE_SELECT);
    },

    toDisplayFeatures(
        state: State,
        geojson: MapGeoJSONFeature & { geometry: { coordinates: Position[] } },
        display
    ) {
        const isActiveLine = geojson.properties.id == state.line.id;
        geojson.properties.active = isActiveLine
            ? constants.activeStates.ACTIVE
            : constants.activeStates.INACTIVE;

        if (!isActiveLine) return display(geojson);

        if (geojson.geometry.coordinates.length > 1)
            display(
                createVertex(
                    state.line.id.toString(),
                    geojson.geometry.coordinates[
                        state.direction === "forward"
                            ? geojson.geometry.coordinates.length - 1
                            : 1
                    ],
                    `${
                        state.direction === "forward"
                            ? geojson.geometry.coordinates.length - 1
                            : 1
                    }`,
                    `${state.distance}`
                )
            );

        if (geojson.geometry.coordinates.length < 2) return;
        geojson.properties.meta = constants.meta.FEATURE;

        createMidpoints(state.line).forEach((midpoint) => display(midpoint));

        display(geojson);
    },
};

export default LineStringAssistedMode;
