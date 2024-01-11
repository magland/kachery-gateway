import { VercelRequest, VercelResponse } from '@vercel/node'
import axios from 'axios'
import githubVerifyAccessToken from '../apiHelpers/common/githubVerifyAccessToken'
import addClientHandler from '../apiHelpers/guiRequestHandlers/addClientHandler'
import addResourceHandler from '../apiHelpers/guiRequestHandlers/addResourceHandler'
import addZoneHandler from '../apiHelpers/guiRequestHandlers/addZoneHandler'
import adminActionHandler from '../apiHelpers/guiRequestHandlers/adminAction'
import deleteClientHandler from '../apiHelpers/guiRequestHandlers/deleteClientHandler'
import deleteResourceHandler from '../apiHelpers/guiRequestHandlers/deleteResourceHandler'
import deleteZoneHandler from '../apiHelpers/guiRequestHandlers/deleteZoneHandler'
import getAdminConfigurationHandler from '../apiHelpers/guiRequestHandlers/getAdminConfiguration'
import getAuthorizationSettingsYamlHandler from '../apiHelpers/guiRequestHandlers/getAuthorizationSettingsYamlHandler'
import getClientsHandler from '../apiHelpers/guiRequestHandlers/getClientsHandler'
import getResourcesHandler from '../apiHelpers/guiRequestHandlers/getResourcesHandler'
import getUsageHandler from '../apiHelpers/guiRequestHandlers/getUsageHandler'
import getZonesHandler from '../apiHelpers/guiRequestHandlers/getZonesHandler'
import getUserInfoHandler from '../apiHelpers/guiRequestHandlers/getUserInfoHandler'
import setAuthorizationSettingsYamlHandler from '../apiHelpers/guiRequestHandlers/setAuthorizationSettingsYamlHandler'
import setClientInfoHandler from '../apiHelpers/guiRequestHandlers/setClientInfoHandler'
import setResourceInfoHandler from '../apiHelpers/guiRequestHandlers/setResourceInfoHandler'
import setZoneInfoHandler from '../apiHelpers/guiRequestHandlers/setZoneInfoHandler'
import testConfigurationHandler from '../apiHelpers/guiRequestHandlers/testConfiguration'
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
    const {userId, githubAccessToken, reCaptchaToken} = auth
    if ((userId) && (!githubAccessToken)) throw Error('No github access token')

    ;(async () => {
        const verifiedUserId = userId ? await githubVerifyAccessToken(userId.toString(), githubAccessToken) : undefined
        const verifiedReCaptchaInfo: VerifiedReCaptchaInfo | undefined = await verifyReCaptcha(reCaptchaToken)
        if (request.type === 'addClient') {
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
        else if (request.type === 'addResource') {
            if (!verifiedReCaptchaInfo) {
                throw Error('ReCaptcha required')
            }
            return await addResourceHandler(request, verifiedUserId)
        }
        else if (request.type === 'deleteResource') {
            if (!verifiedReCaptchaInfo) {
                throw Error('ReCaptcha required')
            }
            return await deleteResourceHandler(request, verifiedUserId)
        }
        else if (request.type === 'getResources') {
            // no recaptcha required
            return await getResourcesHandler(request, verifiedUserId)
        }
        else if (request.type === 'setResourceInfo') {
            if (!verifiedReCaptchaInfo) {
                throw Error('ReCaptcha required')
            }
            return await setResourceInfoHandler(request, verifiedUserId)
        }
        else if (request.type === 'addZone') {
            if (!verifiedReCaptchaInfo) {
                throw Error('ReCaptcha required')
            }
            return await addZoneHandler(request, verifiedUserId)
        }
        else if (request.type === 'deleteZone') {
            if (!verifiedReCaptchaInfo) {
                throw Error('ReCaptcha required')
            }
            return await deleteZoneHandler(request, verifiedUserId)
        }
        else if (request.type === 'getZones') {
            // no recaptcha required
            return await getZonesHandler(request, verifiedUserId)
        }
        else if (request.type === 'setZoneInfo') {
            if (!verifiedReCaptchaInfo) {
                throw Error('ReCaptcha required')
            }
            return await setZoneInfoHandler(request, verifiedUserId)
        }
        else if (request.type === 'getUserInfo') {
            return await getUserInfoHandler(request, verifiedUserId)
        }
        else if (request.type === 'getUsage') {
            return await getUsageHandler(request, verifiedUserId)
        }
        else if (request.type === 'getAdminConfiguration') {
            return await getAdminConfigurationHandler(request, verifiedUserId)
        }
        else if (request.type === 'testConfiguration') {
            return await testConfigurationHandler(request, verifiedUserId)
        }
        else if (request.type === 'adminAction') {
            return await adminActionHandler(request, verifiedUserId)
        }
        else if (request.type === 'getAuthorizationSettingsYaml') {
            return await getAuthorizationSettingsYamlHandler(request, verifiedUserId)
        }
        else if (request.type === 'setAuthorizationSettingsYaml') {
            return await setAuthorizationSettingsYamlHandler(request, verifiedUserId)
        }
        else {
            throw Error(`Unexpected request type: ${request.type}`)
        }
    })().then((response) => {
        if ((request.type === 'addClient') || (request.type === 'deleteClient') || (request.type === 'setClientInfo') || (request.type === 'addResource') || (request.type === 'deleteResource') || (request.type === 'setResourceInfo')) {
            const elapsed = Date.now() - requestTimestamp
            const requestForLog = {...request}
            if (requestForLog['auth']) {
                delete (requestForLog as any)['auth']
            }
            const zone = request.zone
            writeLogItem({request, response, zone, requestTimestamp, elapsed, requestHeaders: req.headers}).then(() => {
                res.json(response)
            }).catch((err2: Error) => {
                console.warn(`Error writing log item: ${err2.message}`)
                res.status(500).send(`Error writing log item: ${err2.message}`)
            })
        }
        else {
            res.json(response)
        }
    }).catch((error: Error) => {
        console.warn(error.message)
        res.status(500).send(`Error: ${error.message}`)
    })
}