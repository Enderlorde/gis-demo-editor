import * as React from "react";
import area from "@turf/area";

import styles from "./control-panel.module.css";

const ControlPanel = (props) => {
    let polygonArea = 0;
    for (const polygon of props.polygons) {
        polygonArea += area(polygon);
    }
    return (
        <div className={styles["control-panel"]}>
            <h3>Полигон</h3>
            {polygonArea > 0 && (
                <p>
                    {Math.round(polygonArea * 100) / 100} <br />
                    square meters
                </p>
            )}
        </div>
    );
};

export default React.memo(ControlPanel);
