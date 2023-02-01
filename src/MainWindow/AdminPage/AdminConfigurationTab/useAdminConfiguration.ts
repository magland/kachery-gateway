import { useCallback, useEffect, useState } from "react"
import guiApiRequest from "../../../common/guiApiRequest"
import useErrorMessage from "../../../errorMessageContext/useErrorMessage"
import { useGithubAuth } from "../../../GithubAuth/useGithubAuth"
import { AdminConfiguration, GetAdminConfigurationRequest, isGetAdminConfigurationResponse } from "../../../types/GuiRequest"
import { adminUsers } from "../../LeftPanel"
import useRoute from "../../useRoute"

const useAdminConfiguration = () => {
    const [adminConfiguration, setAdminConfiguration] = useState<AdminConfiguration | undefined>(undefined)
    const { userId, accessToken } = useGithubAuth()
    const [refreshCode, setRefreshCode] = useState<number>(0)
    const refreshAdminConfiguration = useCallback(() => {
        setRefreshCode(c => (c + 1))
    }, [])
    const {setErrorMessage} = useErrorMessage()
    const {route} = useRoute()

    useEffect(() => {
        let canceled = false
        ; (async () => {
            setErrorMessage('')
            setAdminConfiguration(undefined)
            if (!userId) return
            if (!adminUsers.includes(userId)) return
            const req: GetAdminConfigurationRequest = {
                type: 'getAdminConfiguration',
                zone: route.zone,
                auth: { userId, githubAccessToken: accessToken }
            }
            const resp = await guiApiRequest(req, { reCaptcha: false, setErrorMessage })
            if (!resp) return
            if (!isGetAdminConfigurationResponse(resp)) {
                console.warn(resp)
                throw Error('Unexpected response')
            }
            console.log(resp)
            if (canceled) return
            setAdminConfiguration(resp.adminConfiguration)
        })()
        return () => { canceled = true }
    }, [userId, accessToken, refreshCode, setErrorMessage, route.zone])

    return { adminConfiguration, refreshAdminConfiguration }
}

export default useAdminConfiguration