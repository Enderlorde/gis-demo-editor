import MapboxDraw, {
    DrawCustomMode,
    DrawFeature,
    DrawLineString,
    constants,
} from "@mapbox/mapbox-gl-draw";
import type { Point, Feature } from "geojson";

type featureOptions = {
    featureID?: string;
    from?: Feature<Point> | Point | number[];
};

const LineStringAssistedMode: DrawCustomMode = {
    //Triggered when a mode is selected
    //
    onSetup(options: featureOptions) {
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

    toDisplayFeatures(state, geojson, display) {},
};

export default LineStringAssistedMode;
