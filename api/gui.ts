import { VercelRequest, VercelResponse } from '@vercel/node'
import axios from 'axios'
import googleVerifyIdToken from '../apiHelpers/common/googleVerifyIdToken'
import addClientHandler from '../apiHelpers/guiRequestHandlers/addClientHandler'
import deleteClientHandler from '../apiHelpers/guiRequestHandlers/deleteClientHandler'
import getClientsHandler from '../apiHelpers/guiRequestHandlers/getClientsHandler'
import getRecentActivityHandler from '../apiHelpers/guiRequestHandlers/getRecentActivityHandler'
import setClientInfoHandler from '../apiHelpers/guiRequestHandlers/setClientInfoHandler'
import writeLogItem from '../apiHelpers/writeLogItem'
import { isGuiRequest } from '../src/types/GuiRequest'

const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY

const verifyReCaptcha = async (token: string | undefined) => {
    if (!RECAPTCHA_SECRET_KEY) return undefined
    if (!token) return undefined

    const url = `https://www.google.com/recaptcha/api/siteverify?secret=${RECAPTCHA_SECRET_KEY}&response=${token}`
    const x = await axios.post(url)
    return x.data
}

export type VerifiedReCaptchaInfo = {
    success: boolean,
    challenge_ts: string,
    hostname: string,
    score: number,
    action: string
}

module.exports = (req: VercelRequest, res: VercelResponse) => {    
    const {body: request} = req
    if (!isGuiRequest(request)) {
        res.status(400).send(`Invalid request: ${JSON.stringify(request)}`)
        return
    }

    const requestTimestamp = Date.now()

    const auth = request.auth
    const {userId, googleIdToken, reCaptchaToken} = auth
    if ((userId) && (!googleIdToken)) throw Error('No google id token')

    ;(async () => {
        const verifiedUserId = userId ? await googleVerifyIdToken(userId.toString(), googleIdToken) : undefined
        const verifiedReCaptchaInfo: VerifiedReCaptchaInfo | undefined = await verifyReCaptcha(reCaptchaToken)
        if (request.type === 'getRecentActivity') {
            return await getRecentActivityHandler(request, verifiedUserId)
        }
        else if (request.type === 'addClient') {
            if (!verifiedReCaptchaInfo) {
                throw Error('ReCaptcha required')
            }
            return await addClientHandler(request, verifiedUserId)
        }
        else if (request.type === 'deleteClient') {
            if (!verifiedReCaptchaInfo) {
                throw Error('ReCaptcha required')
            }
            return await deleteClientHandler(request, verifiedUserId)
        }
        else if (request.type === 'getClients') {
            // no recaptcha required
            return await getClientsHandler(request, verifiedUserId)
        }
        else if (request.type === 'setClientInfo') {
            if (!verifiedReCaptchaInfo) {
                throw Error('ReCaptcha required')
            }
            return await setClientInfoHandler(request, verifiedUserId)
        }
        else {
            throw Error(`Unexpected request type: ${request.type}`)
        }
    })().then((response) => {
        const elapsed = Date.now() - requestTimestamp
        writeLogItem({request, response, requestTimestamp, elapsed, requestHeaders: req.headers}).then(() => {
            res.json(response)
        }).catch((err2: Error) => {
            console.warn(`Error writing log item: ${err2.message}`)
            res.status(500).send(`Error writing log item: ${err2.message}`)
        })
    }).catch((error: Error) => {
        console.warn(error.message)
        res.status(500).send(`Error: ${error.message}`)
    })
}