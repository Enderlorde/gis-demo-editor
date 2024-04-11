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
                <option value="red">Red</option>
                <option value="green">Green</option>
                <option value="blue">Blue</option>
            </select>
        </div>
    );
};

export default Dropdown;
