import { VercelRequest, VercelResponse } from '@vercel/node'
import googleVerifyIdToken from '../apiHelpers/common/googleVerifyIdToken'
import getRecentActivityHandler from '../apiHelpers/guiRequestHandlers/getRecentActivityHandler'
import { isGuiRequest } from '../src/types/GuiRequest'

module.exports = (req: VercelRequest, res: VercelResponse) => {    
    const {body: request} = req
    if (!isGuiRequest(request)) {
        res.status(400).send(`Invalid request: ${JSON.stringify(request)}`)
        return
    }

    const auth = request.auth
    const {userId, googleIdToken} = auth
    if ((userId) && (!googleIdToken)) throw Error('No google id token')

    ;(async () => {
        const verifiedUserId = userId ? await googleVerifyIdToken(userId.toString(), googleIdToken) : undefined
        if (request.type === 'getRecentActivity') {
            return await getRecentActivityHandler(request, verifiedUserId)
        }
        else {
            throw Error(`Unexpected request type: ${request.type}`)
        }
    })().then((result) => {
        res.json(result)
    }).catch((error: Error) => {
        console.warn(error.message)
        res.status(500).send(`Error: ${error.message}`)
    })
}