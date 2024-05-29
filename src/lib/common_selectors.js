import { constants as Constants } from "@mapbox/mapbox-gl-draw";

export function isVertex(e) {
    const featureTarget = e.featureTarget;
    if (!featureTarget) return false;
    if (!featureTarget.properties) return false;
    return featureTarget.properties.meta === Constants.meta.VERTEX;
}

export function isEscapeKey(e) {
    return e.keyCode === 27;
}

export function isEnterKey(e) {
    return e.keyCode === 13;
}
