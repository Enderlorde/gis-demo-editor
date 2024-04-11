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
                className={styles.dropdown}
                name="cars"
                id="cars"
            >
                <option value="volvo">Volvo</option>
                <option value="saab">Saab</option>
                <option value="mercedes">Mercedes</option>
                <option value="audi">Audi</option>
            </select>
        </div>
    );
};

export default Dropdown;
