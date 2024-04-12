import MapboxDraw from "@mapbox/mapbox-gl-draw";
import { useControl } from "react-map-gl";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import type { ControlPosition } from "react-map-gl";

type DrawControlProps = ConstructorParameters<typeof MapboxDraw>[0] & {
    position?: ControlPosition;

    onCreate?: (evt: { features: object[] }, mbd: any) => void;
    onUpdate?: (evt: { features: object[]; action: string }, mbd: any) => void;
    onDelete?: (evt: { features: object[] }) => void;
};

export default function DrawControl(props: DrawControlProps) {
    let mbd;
    useControl<MapboxDraw>(
        () => {
            mbd = new MapboxDraw(props);
            console.log(mbd);

            return mbd;
        },
        ({ map }) => {
            console.log(props);

            map.on("draw.create", (e) => props.onCreate(e, mbd));
            map.on("draw.update", (e) => props.onCreate(e, mbd));
            map.on("draw.delete", props.onDelete);
        },
        ({ map }) => {
            map.off("draw.create", (e) => props.onCreate(e, mbd));
            map.off("draw.update", (e) => props.onCreate(e, mbd));
            map.off("draw.delete", props.onDelete);
        },
        { position: props.position }
    );
    return null;
}

DrawControl.defaultProps = {
    onCreate: () => {},
    onUpdate: () => {},
    onDelete: () => {},
};
