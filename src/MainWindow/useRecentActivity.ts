import guiApiRequest from "../common/guiApiRequest"
import { useCallback, useEffect, useState } from "react"
import { GetRecentActivityRequest, isGetRecentActivityResponse } from "../types/GuiRequest"
import { LogItem } from "../types/LogItem"
import { useSignedIn } from "../components/googleSignIn/GoogleSignIn"
import useErrorMessage from "../errorMessageContext/useErrorMessage"

const useRecentActivity = () => {
    const [logItems, setLogItems] = useState<LogItem[] | undefined>(undefined)
    const { userId, googleIdToken } = useSignedIn()
    const {setErrorMessage} = useErrorMessage()

    const [refreshCode, setRefreshCode] = useState<number>(0)
    const refreshRecentActivity = useCallback(() => {
        setRefreshCode(c => (c + 1))
    }, [])

    useEffect(() => {
        ; (async () => {
            setErrorMessage('')
            setLogItems(undefined)
            if (!userId) return
            let canceled = false
            const req: GetRecentActivityRequest = {
                type: 'getRecentActivity',
                auth: { userId, googleIdToken }
            }
            const resp = await guiApiRequest(req, { setErrorMessage })
            if (!resp) return
            if (!isGetRecentActivityResponse(resp)) {
                console.warn(resp)
                throw Error('Unexpected response')
            }
            console.log(resp)
            if (canceled) return
            setLogItems(resp.logItems)
            return () => { canceled = true }
        })()
    }, [userId, googleIdToken, setErrorMessage, refreshCode])

    return { logItems, refreshRecentActivity }
}

export default useRecentActivity