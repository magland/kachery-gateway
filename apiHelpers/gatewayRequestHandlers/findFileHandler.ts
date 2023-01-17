import { Collection } from 'mongodb'
import { FileRecord, isFileRecord } from '../../src/types/FileRecord'
import { FindFileRequest, FindFileResponse } from "../../src/types/GatewayRequest"
import { NodeId, sha1OfString } from "../../src/types/keypair"
import validateObject, { isNumber, isString } from '../../src/types/validateObject'
import { getMongoClient } from '../common/getMongoClient'
import { HeadObjectOutputX } from "./getS3Client"
import { getBucket, getFallbackBucket } from "./getBucket"
import ObjectCache from './ObjectCache'
import { Bucket, getSignedDownloadUrl, headObject } from "./s3Helpers"

const findFileHandler = async (request: FindFileRequest, verifiedClientId?: NodeId, verifiedUserId?: string): Promise<FindFileResponse> => {
    const { hashAlg, hash, zone } = request.payload

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

const signedUrlObjectCache = new ObjectCache<CacheRecord>(1000 * 60 * 30)

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

const deleteFromMongoCache = async (cacheCollection: Collection, cacheKey: string) => {
    // we are assuming it doesn't throw exception if doesn't exist
    await cacheCollection.deleteOne({_id: cacheKey})
}

export const findFile = async (o: {hashAlg: string, hash: string, zone: string | undefined, noFallback?: boolean}): Promise<FindFileResponse> => {
    const {hashAlg, hash, zone} = o

    console.log('--- findFile', hashAlg, hash, zone)

    const bucket: Bucket = await getBucket(zone || 'default')
    const fallbackBucket: Bucket | undefined = await getFallbackBucket(zone || 'default')

    let fileRecord: FileRecord | undefined = undefined

    const h = hash
    const objectKey = `${hashAlg}/${h[0]}${h[1]}/${h[2]}${h[3]}/${h[4]}${h[5]}/${hash}`

    const client = await getMongoClient()
    const cacheCollection = client.db('kachery-gateway').collection('findFileCache')

    // check cache
    const cacheKey = sha1OfString(`${zone}.${bucket.uri}.${objectKey}`).toString()
    // first check in-memory cache
    let aa = signedUrlObjectCache.get(cacheKey) // check memory cache
    if (!aa) {
        aa = await checkMongoCache(cacheCollection, cacheKey)
    }
    if ((aa) && (fallbackBucket) && (o.noFallback) && (aa.fileRecord.bucketUri === fallbackBucket?.uri)) {
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
    
    if (bucket) {
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
            fileRecord = {
                hashAlg,
                hash,
                objectKey,
                bucketUri: bucket.uri,
                size,
                timestamp: Date.now()
            }
            const url = await getSignedDownloadUrl(bucket, fileRecord.objectKey, 60 * 60)

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

    if ((fallbackBucket) && (!o.noFallback)) {
        let headObjectOutput: HeadObjectOutputX | undefined = undefined
        try {
            headObjectOutput = await headObject(fallbackBucket, objectKey)
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
                bucketUri: fallbackBucket.uri,
                size,
                timestamp: Date.now()
            }
            const url = await getSignedDownloadUrl(fallbackBucket, fileRecord.objectKey, 60 * 60)

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