import { InitiateFileUploadRequest, InitiateFileUploadResponse } from "../../src/types/GatewayRequest";
import { NodeId } from "../../src/types/keypair";
import { getClient } from '../common/getDatabaseItems';
import { findFile } from "./findFileHandler";
import getAuthorizationSettings from "./getAuthorizationSettings";
import { getZoneData, joinKeys } from "./getZoneInfo";
import ObjectCache from "./ObjectCache";
import { getSignedUploadUrl } from "./s3Helpers";

export const MAX_UPLOAD_SIZE = 5 * 1000 * 1000 * 1000

export type PendingUpload = {
    projectId: string
    hashAlg: string
    hash: string
    timestamp: number
}
export const getPendingUploadKey = ({hash, hashAlg, projectId}: {hash: string, hashAlg: string, projectId: string}) => {
    return `${projectId}::${hashAlg}://${hash}`
}
export const pendingUploads = new ObjectCache<PendingUpload>(1000 * 60 * 5)

const initiateFileUploadHandler = async (request: InitiateFileUploadRequest, verifiedClientId?: NodeId, verifiedUserId?: string): Promise<InitiateFileUploadResponse> => {
    const { size, hashAlg, hash, zone } = request.payload

    const clientId = verifiedClientId
    let userId = verifiedUserId
    if ((!clientId) && (!userId)) {
        throw Error('No verified client ID or user ID')
    }

    if (size > MAX_UPLOAD_SIZE) {
        throw Error(`File too large: ${size} > ${MAX_UPLOAD_SIZE}`)
    }

    if (clientId) {
        if (userId) {
            throw Error('Both client ID and user ID provided')
        }
        // make sure the client is registered
        // in the future we will check the owner for authorization
        const client = await getClient(zone || 'default', clientId.toString())
        userId = client.ownerId
    }

    if (userId === 'lmfrnk@gmail.com') {
        // a one-off ban to force migration to franklab zone
        throw Error('User banned: please configure to use the appropriate franklab zone')
    }
    
    // check the user ID for authorization
    const authorizationSettings = await getAuthorizationSettings(zone || 'default')
    if (!authorizationSettings.allowPublicUpload) {
        const u = authorizationSettings.authorizedUsers.find(a => (a.userId === userId))
        if (!u) throw Error(`User ${userId} is not authorized.`)
        if (!u.upload) throw Error(`User ${userId} not authorized to upload files.`)
    }

    const findFileResponse = await findFile({hash, hashAlg, noFallback: true, zone})
    if (findFileResponse.found) {
        return {
            type: 'initiateFileUpload',
            alreadyExists: true
        }
    }

    const zoneData = await getZoneData(zone || 'default')

    const h = hash
    // in case we want to copy on finalize
    // const objectKey = joinKeys(zoneInfo.directory, `uploads/${hashAlg}/${h[0]}${h[1]}/${h[2]}${h[3]}/${h[4]}${h[5]}/${hash}.upload.${randomAlphaString(8)}`)
    // const objectKey = joinKeys(zoneInfo.directory, `uploads/${hashAlg}/${h[0]}${h[1]}/${h[2]}${h[3]}/${h[4]}${h[5]}/${hash}`)
    const objectKey = joinKeys(zoneData.directory, `${hashAlg}/${h[0]}${h[1]}/${h[2]}${h[3]}/${h[4]}${h[5]}/${hash}`)

    const bucket = zoneData.bucket
    const signedUploadUrl = await getSignedUploadUrl(bucket, objectKey)

    /////////////////////////////////////////////////////////////////////
    // not working as hoped - maybe because we get a different instance between initiate and finalize
    // const puKey = getPendingUploadKey({hash, hashAlg, projectId})
    // const a = pendingUploads.get(puKey)
    // if (a) {
    //     const elapsed = Date.now() - a.timestamp
    //     if (elapsed >= 1000 * 60) {
    //         pendingUploads.delete(puKey)
    //     }
    //     else {
    //         return {
    //             type: 'initiateFileUpload',
    //             alreadyPending: true
    //         }
    //     }
    // }
    // pendingUploads.set(puKey, {hash, hashAlg, projectId, timestamp: Date.now()})
    /////////////////////////////////////////////////////////////////////
    
    return {
        type: 'initiateFileUpload',
        alreadyExists: false,
        objectKey,
        signedUploadUrl
    }
}

export default initiateFileUploadHandler