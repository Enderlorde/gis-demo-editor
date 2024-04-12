import * as React from "react";
import styles from "./dropdown.module.css";

const Dropdown = (props) => {
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
};

export default Dropdown;
