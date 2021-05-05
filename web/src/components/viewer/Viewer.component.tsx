import { create } from 'random-seed';
import './Viewer.scss';


export function Viewer(props: { name: string | undefined }) {

    const gen = create(props.name);
    const color = '#' + Math.floor(gen(16777215)).toString(16);
    return (
        <div className="viewer">
            <div className="background tooltip" style={{ background: color }}>
                <span className="initial" style={{ color: 'white' }}>
                    {props.name?.charAt(0)}
                </span>
                <span className="tooltiptext">
                    {props.name}
                </span>
            </div>
        </div>
    )
}
