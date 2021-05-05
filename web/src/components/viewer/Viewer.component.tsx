import { useState } from 'react';
import './Viewer.scss';

export function Viewer(props: { name: string | undefined }) {
    return (
        <div className="viewer">
            <div className="background tooltip" style={{ background: '#' + Math.floor(Math.random() * 16777215).toString(16) }}>
                <span className="tooltiptext">
                    {props.name}
                </span>
                <div className="box invert" />
            </div>
        </div>
    )
}
