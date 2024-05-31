import { constants as Constants } from "@mapbox/mapbox-gl-draw";
/**
 * Returns GeoJSON for a Point representing the
 * vertex of another feature.
 *
 * @param {string} parentId
 * @param {Array<number>} coordinates
 * @param {string} path - Dot-separated numbers indicating exactly
 *   where the point exists within its parent feature's coordinates.
 * @param {boolean} hidden
 * @param {boolean} selected
 * @param {object} properties
 * @return {GeoJSON} Point
 */
export default function (
    parentId,
    coordinates,
    path,
    hidden,
    selected,
    properties
) {
    const vertex = {
        type: Constants.geojsonTypes.FEATURE,
        properties: {
            ...properties,
            hidden: hidden,
            meta: Constants.meta.VERTEX,
            parent: parentId,
            coord_path: path,
            active: selected
                ? Constants.activeStates.ACTIVE
                : Constants.activeStates.INACTIVE,
        },
        geometry: {
            type: Constants.geojsonTypes.POINT,
            coordinates,
        },
    };
    return vertex;
}
