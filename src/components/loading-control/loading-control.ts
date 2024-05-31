import { ControlPosition, IControl, Map } from "maplibre-gl";
import { ReactElement } from "react";
import { MapboxMap, useControl } from "react-map-gl";
import { MapContextValue } from "react-map-gl/dist/esm/components/map.js";

type Config = {
    position: ControlPosition;
};

type LoadingProps = {
    position: ControlPosition;
    children?: ReactElement;
};

class LoadingControl implements IControl {
    _map: Map;
    _container: HTMLElement;
    _position: ControlPosition;

    constructor({ position }: Config) {
        this._position = position;
    }

    onAdd(map: Map): HTMLElement {
        this._map = map;
        this._container = document.createElement("div");
        this._container.className = "test";
        return this._container;
    }

    onRemove(map: Map): void {}
}
export default function Loading({ position, children }: LoadingProps): void {
    const ctrl = useControl<LoadingControl>(() => {
        return new LoadingControl({ position });
    });
    return null;
}
