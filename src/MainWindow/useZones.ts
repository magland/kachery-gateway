import { useCallback, useEffect, useState } from "react"
import guiApiRequest from "../common/guiApiRequest"
import useErrorMessage from "../errorMessageContext/useErrorMessage"
import { useGithubAuth } from "../GithubAuth/useGithubAuth"
import { AddZoneRequest, DeleteZoneRequest, GetZonesRequest, isAddZoneResponse, isDeleteZoneResponse, isGetZonesResponse } from "../types/GuiRequest"
import useRoute from "./useRoute"
import { ZoneInfo } from "../types/ZoneInfo"

const useZones = () => {
    const [zoneInfos, setZoneInfos] = useState<ZoneInfo[] | undefined>(undefined)
    const { userId, accessToken } = useGithubAuth()
    const [refreshCode, setRefreshCode] = useState<number>(0)
    const refreshZones = useCallback(() => {
        setRefreshCode(c => (c + 1))
    }, [])
    const {setErrorMessage} = useErrorMessage()
    const {route} = useRoute()

    useEffect(() => {
        let canceled = false
        ; (async () => {
            setErrorMessage('')
            setZoneInfos(undefined)
            if (!userId) return
            const req: GetZonesRequest = {
                type: 'getZones',
                userId,
                auth: { userId, githubAccessToken: accessToken }
            }
            const resp = await guiApiRequest(req, { reCaptcha: false, setErrorMessage })
            if (!resp) return
            if (!isGetZonesResponse(resp)) {
                console.warn(resp)
                throw Error('Unexpected response')
            }
            console.log(resp)
            if (canceled) return
            setZoneInfos(resp.zones)
        })()
        return () => { canceled = true }
    }, [userId, accessToken, refreshCode, setErrorMessage, route.zone])

    const {setRoute} = useRoute()

    const addZone = useCallback((zoneName: string, directory: string, o: {navigateToZonePage?: boolean}) => {
        if (!userId) return
            ; (async () => {
                const req: AddZoneRequest = {
                    type: 'addZone',
                    zone: zoneName,
                    ownerId: userId,
                    bucketName: 'default',
                    directory,
                    auth: { userId, githubAccessToken: accessToken }
                }
                const resp = await guiApiRequest(req, { reCaptcha: true, setErrorMessage })
                if (!resp) return
                if (!isAddZoneResponse(resp)) {
                    throw Error('Unexpected response')
                }
                if (o.navigateToZonePage) {
                    setRoute({page: 'zone', zone: zoneName})
                }
                refreshZones()
            })()
    }, [userId, accessToken, refreshZones, setErrorMessage, setRoute])

    const deleteZone = useCallback((zoneName: string) => {
        if (!userId) return
            ; (async () => {
                const req: DeleteZoneRequest = {
                    type: 'deleteZone',
                    zone: zoneName,
                    auth: { userId, githubAccessToken: accessToken }
                }
                const resp = await guiApiRequest(req, { reCaptcha: true, setErrorMessage })
                if (!resp) return
                if (!isDeleteZoneResponse(resp)) {
                    throw Error('Unexpected response')
                }
                refreshZones()
            })()
    }, [userId, accessToken, refreshZones, setErrorMessage])

    return { zoneInfos, refreshZones, addZone, deleteZone }
}

export default useZones