import { CropSquare, Home, ViewModule } from "@material-ui/icons";
import { FunctionComponent, useMemo } from "react";
import { useGithubAuth } from "../GithubAuth/useGithubAuth";
import './LeftPanel.css';
import LeftPanelItem from "./LeftPanelItem";
import useRoute, { Route } from "./useRoute";

type Props = {
    width: number
    height: number
}

const adminUsersJson = process.env.REACT_APP_ADMIN_USERS || "[]"
const adminUsers = JSON.parse(adminUsersJson) as any as string[]

const LeftPanel: FunctionComponent<Props> = ({width, height}) => {
    const {route, setRoute} = useRoute()

    const {userId} = useGithubAuth()

    const items = useMemo(() => {
        const ret: {
            label: string
            route: Route
            icon?: any
        }[] = [
            {label: 'Home', route: {page: 'home'}, icon: <Home />},
            {label: 'Clients', route: {page: 'clients'}, icon: <ViewModule />},
            {label: 'Resources', route: {page: 'resources'}, icon: <ViewModule />}
        ]
        if ((userId) && (adminUsers.includes(userId.toString()))) {
            ret.push({
                label: 'Admin', route: {page: 'admin'}, icon: <CropSquare />
            })
        }
        return ret
    }, [userId])

    return (
        <div className="LeftPanel" style={{position: 'absolute', width, height}}>
            {
                items.map(item => (
                    <LeftPanelItem
                        key={item.label}
                        label={item.label}
                        icon={item.icon}
                        onClick={() => {setRoute(item.route)}}
                        selected={JSON.stringify(item.route) === JSON.stringify(route)}
                    />
                ))
            }
            <hr />
            <p />
            {/* <LeftPanelItem
                key="documentation"
                label="Documentation"
                icon={<HelpOutline />}
                onClick={() => {(window as any).location="https://github.com/scratchrealm/kachery-gateway"}}
                selected={false}
            /> */}
        </div>
    )
}

export default LeftPanel