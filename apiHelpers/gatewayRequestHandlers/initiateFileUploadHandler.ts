import { InitiateFileUploadRequest, InitiateFileUploadResponse } from "../../src/types/GatewayRequest";
import { NodeId } from "../../src/types/keypair";
import { findFile } from "./findFileHandler";
import ObjectCache from "./ObjectCache";
import { Bucket, getSignedUploadUrl } from "./s3Helpers";

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

export const getBucket = () => {
    const bucket: Bucket = {
        uri: 'wasabi://kachery-cloud?region=us-east-1',
        credentials: process.env['BUCKET_CREDENTIALS'] || ''
    }
    if (!bucket.credentials) {
        throw Error(`Environment variable not set: BUCKET_CREDENTIALS`)
    }
    return bucket
}
const bucket = getBucket()

const initiateFileUploadHandler = async (request: InitiateFileUploadRequest, verifiedClientId?: NodeId): Promise<InitiateFileUploadResponse> => {
    const { size, hashAlg, hash } = request.payload

    const clientId = verifiedClientId
    if (!clientId) {
        throw Error('No verified client ID')
    }

    if (size > MAX_UPLOAD_SIZE) {
        throw Error(`File too large: ${size} > ${MAX_UPLOAD_SIZE}`)
    }

    const findFileResponse = await findFile({hash, hashAlg})
    if (findFileResponse.found) {
        return {
            type: 'initiateFileUpload',
            alreadyExists: true
        }
    }

    const h = hash
    // in case we want to copy on finalize
    // const objectKey = `uploads/${hashAlg}/${h[0]}${h[1]}/${h[2]}${h[3]}/${h[4]}${h[5]}/${hash}.upload.${randomAlphaString(8)}`
    const objectKey = `uploads/${hashAlg}/${h[0]}${h[1]}/${h[2]}${h[3]}/${h[4]}${h[5]}/${hash}`

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