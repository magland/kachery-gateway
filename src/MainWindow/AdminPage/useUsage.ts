import { useCallback, useEffect, useState } from "react"
import guiApiRequest from "../../common/guiApiRequest"
import useErrorMessage from "../../errorMessageContext/useErrorMessage"
import { useGithubAuth } from "../../GithubAuth/useGithubAuth"
import { GetUsageRequest, isGetUsageResponse, UsageRequestUsage } from "../../types/GuiRequest"
import useRoute from "../useRoute"

const useUsage = () => {
    const [usage, setUsage] = useState<UsageRequestUsage | undefined>(undefined)
    const { userId, accessToken } = useGithubAuth()
    const [refreshCode, setRefreshCode] = useState<number>(0)
    const refreshUsage = useCallback(() => {
        setRefreshCode(c => (c + 1))
    }, [])
    const {setErrorMessage} = useErrorMessage()
    const {route} = useRoute()

    useEffect(() => {
        let canceled = false
        ; (async () => {
            setErrorMessage('')
            setUsage(undefined)
            if (!userId) return
            const req: GetUsageRequest = {
                type: 'getUsage',
                zone: route.zone,
                auth: { userId, githubAccessToken: accessToken }
            }
            const resp = await guiApiRequest(req, { reCaptcha: false, setErrorMessage })
            if (!resp) return
            if (!isGetUsageResponse(resp)) {
                console.warn(resp)
                throw Error('Unexpected response')
            }
            console.log(resp)
            if (canceled) return
            setUsage(resp.usage)
        })()
        return () => { canceled = true }
    }, [userId, accessToken, refreshCode, setErrorMessage, route.zone])

    return { usage, refreshUsage }
}

export default useUsage