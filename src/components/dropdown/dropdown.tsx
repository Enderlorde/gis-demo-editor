import * as React from "react";
import { useControl } from "react-map-gl/maplibre";
import styles from "./dropdown.module.css";

const Dropdown = (props) => {
    useControl(
        () => {
            return (
                <div className="dropdown">
                    <img
                        src=""
                        alt=""
                        className={styles.dropdown__icon}
                    />
                    <select
                        onChange={props.onChange}
                        className={styles.dropdown}
                        name="color"
                        id="colorSelect"
                    >
                        <option value="45">45</option>
                        <option value="argyle">Argyle</option>
                        <option value="carbon">Carbon</option>
                        <option value="tile">Tile</option>
                    </select>
                </div>
            );
        },
        (map) => {},
        (map) => {}
    );
    return null;
};

export default Dropdown;
