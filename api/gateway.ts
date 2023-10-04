import { VercelRequest, VercelResponse } from '@vercel/node'
import { isDeleteFileRequest, isFinalizeFileUploadRequest, isFindFileRequest, isGatewayRequest, isGetClientInfoRequest, isGetResourceInfoRequest, isGetZoneInfoRequest, isInitiateFileUploadRequest } from '../src/types/GatewayRequest'
import { hexToPublicKey, verifySignature } from '../src/crypto/signatures'
import { NodeId, nodeIdToPublicKeyHex } from '../src/types/keypair'
import findFileHandler from '../apiHelpers/gatewayRequestHandlers/findFileHandler'
import writeLogItem from '../apiHelpers/writeLogItem'
import initiateFileUploadHandler from '../apiHelpers/gatewayRequestHandlers/initiateFileUploadHandler'
import finalizeFileUploadHandler from '../apiHelpers/gatewayRequestHandlers/finalizeFileUploadHandler'
import getClientInfoHandler from '../apiHelpers/gatewayRequestHandlers/getClientInfoHandler'
import getZoneInfoHandler from '../apiHelpers/gatewayRequestHandlers/getZoneInfoHandler'
import githubVerifyAccessToken from '../apiHelpers/common/githubVerifyAccessToken'
import getResourceInfoHandler from '../apiHelpers/gatewayRequestHandlers/getResourceInfoHandler'
import deleteFileHandler from '../apiHelpers/gatewayRequestHandlers/deleteFileHandler'

module.exports = (req: VercelRequest, res: VercelResponse) => {
    const {body: request} = req

    // CORS ///////////////////////////////////
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    if ([
        'http://localhost:3000',
        'http://localhost:3001',
        'https://figurl.org',
        'https://www.figurl.org'
    ].includes(req.headers.origin || '')) {
        res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '')
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    )
    if (req.method === 'OPTIONS') {
        res.status(200).end()
        return
    }
    ///////////////////////////////////////////

    // if (req.method !== 'POST') {
    //     res.status(400).send(`Invalid method: ${req.method}`)
    //     return
    // }

    if (!isGatewayRequest(request)) {
        res.status(400).send(`Invalid request: ${JSON.stringify(request)}`)
        return
    }

    const requestTimestamp = Date.now()

    const { payload, fromClientId, signature, githubUserId, githubAccessToken } = request
    const { timestamp } = payload
    const elapsed = Date.now() - timestamp
    if ((elapsed > 30000) || (elapsed < -30000)) { 
        // Note the range used to be narrower, but was running into problems
        // For example, got elapsed = -662
        // Not sure the best way to do this check
        throw Error(`Invalid timestamp. ${timestamp} ${Date.now()} ${elapsed}`)
    }

    let zone: string | undefined = undefined
    ;(async () => {
        let verifiedClientId: NodeId | undefined = undefined
        if (fromClientId) {
            if (!signature) throw Error('No signature provided with fromClientId')
            if (!(await verifySignature(payload, hexToPublicKey(nodeIdToPublicKeyHex(fromClientId)), signature))) {
                throw Error('Invalid signature')
            }
            verifiedClientId = fromClientId
        }

        let verifiedUserId: string | undefined = undefined
        if (githubUserId) {
            if (!(await githubVerifyAccessToken(githubUserId, githubAccessToken))) {
                throw Error('Unable to verify github user ID')
            }
            verifiedUserId = githubUserId
        }

        if (isFindFileRequest(request)) {
            zone = request.payload.zone
            return await findFileHandler(request, verifiedClientId, verifiedUserId)
        }
        else if (isInitiateFileUploadRequest(request)) {
            zone = request.payload.zone
            return await initiateFileUploadHandler(request, verifiedClientId, verifiedUserId)
        }
        else if (isFinalizeFileUploadRequest(request)) {
            zone = request.payload.zone
            return await finalizeFileUploadHandler(request, verifiedClientId, verifiedUserId)
        }
        else if (isDeleteFileRequest(request)) {
            zone = request.payload.zone
            return await deleteFileHandler(request, verifiedClientId, verifiedUserId)
        }
        else if (isGetClientInfoRequest(request)) {
            zone = request.payload.zone
            return await getClientInfoHandler(request)
        }
        else if (isGetResourceInfoRequest(request)) {
            zone = request.payload.zone
            return await getResourceInfoHandler(request)
        }
        else if (isGetZoneInfoRequest(request)) {
            zone = request.payload.zoneName
            return await getZoneInfoHandler(request)
        }
        else {
            throw Error(`Unexpected request type: ${(request as any).payload.type}`)
        }
    })().then((response) => {
        let shouldWriteLogItem = false
        if ((request.payload.type === 'initiateFileUpload') && (response.type === 'initiateFileUpload') && (!response.alreadyExists)) {
            shouldWriteLogItem = true
        }
        if (request.payload.type === 'finalizeFileUpload') {
            shouldWriteLogItem = true
        }
        if ((request.payload.type === 'findFile') && (response.type === 'findFile') && (!response.cacheHit)) {
            shouldWriteLogItem = true
        }
        if (request.payload.type === 'deleteFile') {
            shouldWriteLogItem = true
        }
        if (shouldWriteLogItem) {
            const elapsed = Date.now() - requestTimestamp
            writeLogItem({request, zone: zone || 'default', response, requestTimestamp, elapsed, requestHeaders: req.headers}).then(() => {
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