import { VercelRequest, VercelResponse } from '@vercel/node'
import { isFinalizeFileUploadRequest, isFindFileRequest, isGatewayRequest, isInitiateFileUploadRequest } from '../src/types/GatewayRequest'
import { hexToPublicKey, verifySignature } from '../src/types/crypto/signatures'
import { nodeIdToPublicKeyHex } from '../src/types/keypair'
import findFileHandler from '../apiHelpers/gatewayRequestHandlers/findFileHandler'
import writeLogItem from '../apiHelpers/writeLogItem'
import initiateFileUploadHandler from '../apiHelpers/gatewayRequestHandlers/initiateFileUploadHandler'
import finalizeFileUploadHandler from '../apiHelpers/gatewayRequestHandlers/finalizeFileUploadHandler'

module.exports = (req: VercelRequest, res: VercelResponse) => {
    const {body: request} = req
    if (!isGatewayRequest(request)) {
        res.status(400).send(`Invalid request: ${JSON.stringify(request)}`)
        return
    }

    const requestTimestamp = Date.now()

    const { payload, fromClientId, signature } = request
    const { timestamp } = payload
    const elapsed = Date.now() - timestamp
    if ((elapsed > 30000) || (elapsed < -30000)) { 
        // Note the range used to be narrower, but was running into problems
        // For example, got elapsed = -662
        // Not sure the best way to do this check
        throw Error(`Invalid timestamp. ${timestamp} ${Date.now()} ${elapsed}`)
    }

    ;(async () => {
        if (!(await verifySignature(payload, hexToPublicKey(nodeIdToPublicKeyHex(fromClientId)), signature))) {
            throw Error('Invalid signature')
        }
        const verifiedClientId = fromClientId

        if (isFindFileRequest(request)) {
            return await findFileHandler(request, verifiedClientId)
        }
        else if (isInitiateFileUploadRequest(request)) {
            return await initiateFileUploadHandler(request, verifiedClientId)
        }
        else if (isFinalizeFileUploadRequest(request)) {
            return await finalizeFileUploadHandler(request, verifiedClientId)
        }
        else {
            throw Error(`Unexpected request type: ${(request as any).payload.type}`)
        }
    })().then((response) => {
        const elapsed = Date.now() - timestamp
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