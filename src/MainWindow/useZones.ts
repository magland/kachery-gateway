import { useCallback, useEffect, useState } from "react"
import guiApiRequest from "../common/guiApiRequest"
import useErrorMessage from "../errorMessageContext/useErrorMessage"
import { useGithubAuth } from "../GithubAuth/useGithubAuth"
import { AddZoneRequest, DeleteZoneRequest, GetZonesRequest, isAddZoneResponse, isDeleteZoneResponse, isGetZonesResponse } from "../types/GuiRequest"
import useRoute from "./useRoute"

const useZones = () => {
    const [zoneInfos, setZoneInfos] = useState<ZoneInfo[] | undefined>(undefined)
    const { userId, accessToken } = useGithubAuth()
    const [refreshCode, setRefreshCode] = useState<number>(0)
    const refreshResources = useCallback(() => {
        setRefreshCode(c => (c + 1))
    }, [])
    const {setErrorMessage} = useErrorMessage()
    const {route} = useRoute()

    useEffect(() => {
        let canceled = false
        ; (async () => {
            setErrorMessage('')
            setResources(undefined)
            if (!userId) return
            const req: GetResourcesRequest = {
                type: 'getResources',
                zone: route.zone,
                userId,
                auth: { userId, githubAccessToken: accessToken }
            }
            const resp = await guiApiRequest(req, { reCaptcha: false, setErrorMessage })
            if (!resp) return
            if (!isGetResourcesResponse(resp)) {
                console.warn(resp)
                throw Error('Unexpected response')
            }
            console.log(resp)
            if (canceled) return
            setResources(resp.resources)
        })()
        return () => { canceled = true }
    }, [userId, accessToken, refreshCode, setErrorMessage, route.zone])

    const {setRoute} = useRoute()

    const addResource = useCallback((resourceName: string, proxyUrl: string, o: {navigateToResourcePage?: boolean}) => {
        if (!userId) return
            ; (async () => {
                const req: AddResourceRequest = {
                    type: 'addResource',
                    resourceName,
                    ownerId: userId,
                    proxyUrl,
                    zone: route.zone,
                    auth: { userId, githubAccessToken: accessToken }
                }
                const resp = await guiApiRequest(req, { reCaptcha: true, setErrorMessage })
                if (!resp) return
                if (!isAddResourceResponse(resp)) {
                    throw Error('Unexpected response')
                }
                if (o.navigateToResourcePage) {
                    setRoute({page: 'resource', resourceName, zone: route.zone})
                }
                refreshResources()
            })()
    }, [userId, accessToken, refreshResources, setErrorMessage, setRoute, route.zone])

    const deleteResource = useCallback((resourceName: string) => {
        if (!userId) return
            ; (async () => {
                const req: DeleteResourceRequest = {
                    type: 'deleteResource',
                    resourceName,
                    zone: route.zone,
                    ownerId: userId,
                    auth: { userId, githubAccessToken: accessToken }
                }
                const resp = await guiApiRequest(req, { reCaptcha: true, setErrorMessage })
                if (!resp) return
                if (!isDeleteResourceResponse(resp)) {
                    throw Error('Unexpected response')
                }
                refreshResources()
            })()
    }, [userId, accessToken, refreshResources, setErrorMessage, route.zone])

    return { resources, refreshResources, addResource, deleteResource }
}

export default useResources