import { CropSquare, Home, ViewModule } from "@material-ui/icons";
import { FunctionComponent, useEffect, useMemo, useState } from "react";
import useErrorMessage from "../errorMessageContext/useErrorMessage";
import { useGithubAuth } from "../GithubAuth/useGithubAuth";
import { GetUserInfoRequest, isGetUserInfoResponse } from "../types/GuiRequest";
import guiApiRequest from "./guiApiRequest";
import './LeftPanel.css';
import LeftPanelItem from "./LeftPanelItem";
import useRoute, { Route } from "./useRoute";

type Props = {
    width: number
    height: number
}

const adminUsersJson = process.env.REACT_APP_ADMIN_USERS || "[]"
export const adminUsers = JSON.parse(adminUsersJson) as any as string[]

export const useIsAdminForZone = () => {
    const {route} = useRoute()
    const {userId, accessToken} = useGithubAuth()
    const [isAdminForZone, setIsAdminForZone] = useState<boolean | undefined>()
    const {setErrorMessage} = useErrorMessage()

    useEffect(() => {
        if (userId && adminUsers.includes(userId.toString())) {
            setIsAdminForZone(true)
            return
        }
        let canceled = false
        ; (async () => {
            setIsAdminForZone(undefined)
            if (!userId) return
            const req: GetUserInfoRequest = {
                type: 'getUserInfo',
                userId,
				zone: route.zone,
                auth: { userId, githubAccessToken: accessToken }
            }
            const resp = await guiApiRequest(req, { reCaptcha: false, setErrorMessage })
            if (!resp) return
            if (!isGetUserInfoResponse(resp)) {
                console.warn(resp)
                throw Error('Unexpected response')
            }
            if (canceled) return
            setIsAdminForZone(resp.isAdmin)
        })()
        return () => { canceled = true }
    }, [userId, accessToken, setErrorMessage, route.zone])
    return isAdminForZone
}

const LeftPanel: FunctionComponent<Props> = ({width, height}) => {
    const {route, setRoute} = useRoute()

    const isAdminForZone = useIsAdminForZone()

    const items = useMemo(() => {
        const ret: {
            label: string
            route: Route
            icon?: any
        }[] = [
            {label: 'Home', route: {page: 'home', zone: route.zone}, icon: <Home />},
            {label: 'Clients', route: {page: 'clients', zone: route.zone}, icon: <ViewModule />},
            {label: 'Zones', route: {page: 'zones', zone: route.zone}, icon: <ViewModule />},
            {label: 'Resources', route: {page: 'resources', zone: route.zone}, icon: <ViewModule />}
        ]
        if (isAdminForZone) {
            ret.push({
                label: 'Admin', route: {page: 'admin', zone: route.zone}, icon: <CropSquare />
            })
        }
        return ret
    }, [route.zone, isAdminForZone])

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