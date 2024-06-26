import * as CommonSelectors from "../lib/common_selectors.js";
import doubleClickZoom from "../lib/double_click_zoom.js";
import { constants as Constants } from "@mapbox/mapbox-gl-draw";
import createVertex from "../lib/create_vertex.js";

import * as _ from "lodash";
import lineToPolygon from "@turf/line-to-polygon";
import area from "@turf/area";
import length from "@turf/length";
import centerOfMass from "@turf/center-of-mass";

const DrawArea = {
    //При переходе в этот режим
    onSetup() {
        // Создаем пустой draw feature линии
        const line = this.newFeature({
            type: Constants.geojsonTypes.FEATURE,
            properties: {},
            geometry: {
                type: Constants.geojsonTypes.LINE_STRING,
                coordinates: [[]],
            },
        });

        // Переменная в которой хранится feature полигона
        // TODO: Подумать как его удалить отсюда, выглядит неаккуратно
        const polygon = {};

        //Добавляем draw feature на слой рисования
        this.addFeature(line);

        this.clearSelectedFeatures();
        doubleClickZoom.disable(this);

        // TODO: Подумать над способом реализации
        /* this.updateUIClasses({ mouse: Constants.cursors.ADD }); */

        // Подсвечиваем кнопку режима в UI
        this.activateUIButton(Constants.types.POLYGON);

        // Устанавливаем, какие действия допустимы в этом режиме
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

    // По клику где-либо на карте если линия не замкнута добавляем точку, если линия замкнута и преобразована в полигон - удаляем полигон и выходим в режим SIMPLE_SELECT
    clickAnywhere(state, e) {
        /* this.updateUIClasses({ mouse: Constants.cursors.ADD }); */
        if (state.mode === "line") {
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
            this.deleteFeature([state.polygon.id], { silent: true });
            this.changeMode(Constants.modes.SIMPLE_SELECT);
        }
    },

    //Срабатывает если выбрана вершина, и если она является первой точкой - замыкаем линию и преобразуем ее в полигон, после вычисляем его площадь и периметр
    clickOnVertex(state, e) {
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
                        area: `${area(polygon)} м2`,
                        length: `${length(state.line)} км`,
                    },
                });
                this.deleteFeature([state.line.id], { silent: true });
                state.line = undefined;
                state.currentVertexPosition = 0;
                this.addFeature(state.polygon);
            }
        }
    },

    //При каждом движении мыши обновляем крайнюю точку если линия не замкнута
    onMouseMove(state, e) {
        if (state.mode === "line" && state.line) {
            state.line.updateCoordinate(
                state.currentVertexPosition.toString(),
                e.lngLat.lng,
                e.lngLat.lat
            );

            // Меняем стиль курсора по наведению на вершину
            if (CommonSelectors.isVertex(e)) {
                e.target.getCanvas().style.cursor = "pointer";
            } else {
                e.target.getCanvas().style.cursor = "crosshair";
            }
        }
    },

    // По клику проверяем, произошел клик по вершине или в случайном месте на карте
    onClick(state, e) {
        if (CommonSelectors.isVertex(e) && state.currentVertexPosition > 0)
            return this.clickOnVertex(state, e);
        return this.clickAnywhere(state, e);
    },

    //По нажатию на ESC удаляем draw feature линии и полигона и переходим в режим SIMPLE_SELECT
    onKeyUp(state, e) {
        if (CommonSelectors.isEscapeKey(e)) {
            if (state.mode === "line") {
                this.deleteFeature([state.line.id], { silent: true });
            } else {
                this.deleteFeature([state.polygon.id], { silent: true });
            }
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

    //This is the only required function for a mode.
    // It decides which features currently in Draw's data store will be rendered on the map.
    // All features passed to `display` will be rendered, so you can pass multiple display features per internal feature.
    // See `styling-draw` in `API.md` for advice on making display features
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
        //Создаем точку в начале линии
        if (state.mode !== "polygon") {
            display(
                createVertex(
                    state.line.id,
                    geojson.geometry.coordinates[0],
                    "0",
                    false
                )
            );
        }
        if (state.mode === "polygon") {
            display(
                createVertex(
                    state.polygon.id,
                    geojson.geometry.coordinates[0][0],
                    "0",
                    true,
                    false,
                    { length: state.polygon.properties["length"] }
                )
            );
            display(
                createVertex(
                    state.polygon.id,
                    centerOfMass(state.polygon).geometry.coordinates,
                    "0",
                    true,
                    false,
                    { length: state.polygon.properties["area"] }
                )
            );
        }
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
