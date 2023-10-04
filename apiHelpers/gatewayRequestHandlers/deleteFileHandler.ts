import { DeleteFileRequest, DeleteFileResponse } from "../../src/types/GatewayRequest";
import { NodeId, sha1OfString } from '../../src/types/keypair';
import { getClient } from "../common/getDatabaseItems";
import { getMongoClient } from "../common/getMongoClient";
import { signedUrlObjectCache } from "./findFileHandler";
import getAuthorizationSettings from "./getAuthorizationSettings";
import { getBucket, getFallbackBucket } from "./getBucket";
import { HeadObjectOutputX } from "./getS3Client";
import { Bucket, deleteObject, headObject } from "./s3Helpers";

const deleteFileHandler = async (request: DeleteFileRequest, verifiedClientId?: NodeId, verifiedUserId?: string): Promise<DeleteFileResponse> => {
    const { hash, hashAlg, zone } = request.payload

    const clientId = verifiedClientId
    let userId = verifiedUserId
    if ((!clientId) && (!userId)) {
        throw Error('No verified client ID or user ID')
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

    // check the user ID for authorization
    const authorizationSettings = await getAuthorizationSettings(zone || 'default')
    const u = authorizationSettings.authorizedUsers.find(a => (a.userId === userId))
    if (!u) throw Error(`User ${userId} is not authorized.`)
    if (!u.admin) throw Error(`User ${userId} not authorized to delete files.`)

    const bucket = await getBucket(zone || 'default')
    const fallbackBucket: Bucket | undefined = await getFallbackBucket(zone || 'default')

    const h = hash
    const objectKey = `${hashAlg}/${h[0]}${h[1]}/${h[2]}${h[3]}/${h[4]}${h[5]}/${hash}`

    const doDeleteFromCache = async (bucketUri: string) => {
        // delete from cache
        const client = await getMongoClient()
        const cacheCollection = client.db('kachery-gateway').collection('findFileCache')

        // check cache
        const cacheKey = sha1OfString(`${zone}.${bucketUri}.${objectKey}`).toString()
        // first check in-memory cache
        let aa = signedUrlObjectCache.get(cacheKey) // check memory cache
        if (aa) {
            signedUrlObjectCache.delete(cacheKey)
        }
    }

    // check in Bucket
    let headObjectOutput: HeadObjectOutputX | undefined = undefined
    try {
        headObjectOutput = await headObject(bucket, objectKey)
    }
    catch(err) {
        // continue
    }
    if (headObjectOutput) {
        const size = headObjectOutput.ContentLength
        if (size === undefined) throw Error('No ContentLength in headObjectOutput')

        await deleteObject(bucket, objectKey)
        await doDeleteFromCache(bucket.uri)
        return {
            type: 'deleteFile',
            success: true
        }
    }
    
    // check in fallback bucket
    if (fallbackBucket) {
        try {
            headObjectOutput = await headObject(fallbackBucket, objectKey)
        }
        catch(err) {
            // continue
        }
        if (headObjectOutput) {
            const size = headObjectOutput.ContentLength
            if (size === undefined) throw Error('No ContentLength in headObjectOutput in fallback bucket')

            await deleteObject(fallbackBucket, objectKey)
            await doDeleteFromCache(fallbackBucket.uri)
            return {
                type: 'deleteFile',
                success: true
            }
        }
    }

    throw Error(`File not found: ${objectKey}`)
}

export default deleteFileHandler