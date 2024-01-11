import { Collection } from 'mongodb'
import { FileRecord, isFileRecord } from '../../src/types/FileRecord'
import { FindFileRequest, FindFileResponse } from "../../src/types/GatewayRequest"
import { NodeId, sha1OfString } from "../../src/types/keypair"
import validateObject, { isNumber, isString } from '../../src/types/validateObject'
import { getClient } from '../common/getDatabaseItems'
import { getMongoClient } from '../common/getMongoClient'
import ObjectCache from './ObjectCache'
import getAuthorizationSettings from './getAuthorizationSettings'
import { HeadObjectOutputX } from "./getS3Client"
import { getZoneData, joinKeys } from './getZoneInfo'
import { getSignedDownloadUrl, headObject } from "./s3Helpers"

const findFileHandler = async (request: FindFileRequest, verifiedClientId?: NodeId, verifiedUserId?: string): Promise<FindFileResponse> => {
    const { hashAlg, hash, zone } = request.payload

    // check the user ID for authorization
    // but only do all of this if allowPublicDownload is false for this zone
    const authorizationSettings = await getAuthorizationSettings(zone || 'default')
    if (authorizationSettings.allowPublicDownload === false) { // by default (when undefined) this is true
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
        
        const u = authorizationSettings.authorizedUsers.find(a => (a.userId === userId))
        if (!u) throw Error(`User ${userId} is not authorized.`)
        if (!u.download) throw Error(`User ${userId} not authorized to download files.`)
    }

    return findFile({hashAlg, hash, zone})
}

type CacheRecord = {
    timestampCreated: number,
    url: string, // signed download url
    fileRecord: FileRecord
}

const isCacheRecord = (x: any): x is CacheRecord => {
    return validateObject(x, {
        timestampCreated: isNumber,
        url: isString,
        fileRecord: isFileRecord
    })
}

export const signedUrlObjectCache = new ObjectCache<CacheRecord>(1000 * 60 * 30)

const checkMongoCache = async (cacheCollection: Collection, cacheKey: string): Promise<CacheRecord | undefined> => {
    let result: any
    try {
        result = await cacheCollection.findOne({_id: cacheKey})
    }
    catch(err) {
        return undefined
    }
    if (!result) return undefined
    const cacheRecord = {...result}
    delete (cacheRecord as any)['_id']
    if (!isCacheRecord(cacheRecord)) {
        console.warn(cacheKey)
        console.warn(cacheRecord)
        console.warn('WARNING: Error in cache record')
        return undefined
    }
    return cacheRecord
}

const setMongoCache = async (cacheCollection: Collection, cacheKey: string, cacheRecord: CacheRecord) => {
    const doc = {...cacheRecord, _id: cacheKey}
    await cacheCollection.replaceOne({_id: cacheKey}, doc, {upsert: true})
}

export const deleteFromMongoCache = async (cacheCollection: Collection, cacheKey: string) => {
    // we are assuming it doesn't throw exception if doesn't exist
    await cacheCollection.deleteOne({_id: cacheKey})
}

export const findFile = async (o: {hashAlg: string, hash: string, zone: string | undefined, noFallback?: boolean}): Promise<FindFileResponse> => {
    const {hashAlg, hash, zone} = o

    const zoneData = await getZoneData(zone || 'default')

    let fileRecord: FileRecord | undefined = undefined

    const h = hash
    const objectKey = joinKeys(zoneData.directory, `${hashAlg}/${h[0]}${h[1]}/${h[2]}${h[3]}/${h[4]}${h[5]}/${hash}`)

    const client = await getMongoClient()
    const cacheCollection = client.db('kachery-gateway').collection('findFileCache')

    // check cache
    const cacheKey = sha1OfString(`${zone}.${zoneData.bucket.uri}.${objectKey}`).toString()
    // first check in-memory cache
    // this will only be available for the lifetime of the serverless function server instance
    let aa = signedUrlObjectCache.get(cacheKey) // check memory cache
    if (!aa) {
        // check db cache
        aa = await checkMongoCache(cacheCollection, cacheKey)
    }
    if ((aa) && (zoneData.fallbackBucket) && (o.noFallback) && (aa.fileRecord.bucketUri === zoneData.fallbackBucket?.uri)) {
        // if the cached record is a fallback cache record
        // and o.noFallback is true
        // then we should not use the cache hit
        aa = undefined
    }

    if (aa) {
        // we have a cache hit
        const elapsed = Date.now() - aa.timestampCreated
        if (elapsed < 1000 * 60 * 30) {
            // it is recent enough
            return {
                type: 'findFile',
                found: true,
                size: aa.fileRecord.size,
                bucketUri: aa.fileRecord.bucketUri,
                objectKey: aa.fileRecord.objectKey,
                url: aa.url,
                cacheHit: true
            }
        }
        else {
            // it is not recent enough
            signedUrlObjectCache.delete(cacheKey) // delete from memory cache
            await deleteFromMongoCache(cacheCollection, cacheKey) // delete from mongo cache
        }
    }
    
    if (zoneData.bucket) {
        let headObjectOutput: HeadObjectOutputX | undefined = undefined
        try {
            headObjectOutput = await headObject(zoneData.bucket, objectKey)
        }
        catch(err) {
            // continue
        }
        if (headObjectOutput) {
            const size = headObjectOutput.ContentLength
            if (size === undefined) throw Error('No ContentLength in headObjectOutput')
            fileRecord = {
                hashAlg,
                hash,
                objectKey,
                bucketUri: zoneData.bucket.uri,
                size,
                timestamp: Date.now()
            }
            const url = await getSignedDownloadUrl(zoneData.bucket, fileRecord.objectKey, 60 * 60)

            // store in cache
            const cacheRecord = {timestampCreated: Date.now(), url, fileRecord}

            // first set to in-memory cache
            signedUrlObjectCache.set(cacheKey, cacheRecord)
            // second set to db cache
            await setMongoCache(cacheCollection, cacheKey, cacheRecord)
        
            return {
                type: 'findFile',
                found: true,
                size: fileRecord.size,
                bucketUri: fileRecord.bucketUri,
                objectKey: fileRecord.objectKey,
                url,
                cacheHit: false
            }
        }
    }

    if ((zoneData.fallbackBucket) && (!o.noFallback)) {
        let headObjectOutput: HeadObjectOutputX | undefined = undefined
        try {
            headObjectOutput = await headObject(zoneData.fallbackBucket, objectKey)
        }
        catch(err) {
            // continue
        }
        if (headObjectOutput) {
            const size = headObjectOutput.ContentLength
            if (size === undefined) throw Error('No ContentLength in headObjectOutput')
            fileRecord = {
                hashAlg,
                hash,
                objectKey,
                bucketUri: zoneData.fallbackBucket.uri,
                size,
                timestamp: Date.now()
            }
            const url = await getSignedDownloadUrl(zoneData.fallbackBucket, fileRecord.objectKey, 60 * 60)

            // store in cache
            const cacheRecord = {timestampCreated: Date.now(), url, fileRecord}

            // first set to in-memory cache
            signedUrlObjectCache.set(cacheKey, cacheRecord)
            // second set to db cache
            await setMongoCache(cacheCollection, cacheKey, cacheRecord)
        
            return {
                type: 'findFile',
                found: true,
                size: fileRecord.size,
                bucketUri: fileRecord.bucketUri,
                objectKey: fileRecord.objectKey,
                url,
                cacheHit: false,
                fallback: true
            }
        }
    }

    return {
        type: 'findFile',
        found: false
    }
}

export default findFileHandler