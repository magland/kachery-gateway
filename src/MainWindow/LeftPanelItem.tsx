import { FunctionComponent } from "react";

type Props = {
    label: string
    onClick: () => void
    selected: boolean
    icon?: any
}

const LeftPanelItem: FunctionComponent<Props> = ({label, icon, onClick, selected}) => {
    const className = selected ? "LeftPanelItem selected" : "LeftPanelItem"
    return (
        <div className={className} onClick={onClick}>
            {icon && icon}&nbsp;
            <span>{label}</span>
        </div>
    )
}

export default LeftPanelItem