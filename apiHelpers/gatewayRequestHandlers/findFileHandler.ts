import { Collection } from 'mongodb'
import { FileRecord, isFileRecord } from '../../src/types/FileRecord'
import { FindFileRequest, FindFileResponse } from "../../src/types/GatewayRequest"
import { NodeId, sha1OfString } from "../../src/types/keypair"
import validateObject, { isNumber } from '../../src/types/validateObject'
import { getMongoClient } from '../common/getMongoClient'
import { HeadObjectOutputX } from "./getS3Client"
import { getBucket, getFallbackBucket } from "./initiateFileUploadHandler"
import ObjectCache from './ObjectCache'
import { Bucket, getSignedDownloadUrl, headObject } from "./s3Helpers"

const findFileHandler = async (request: FindFileRequest, verifiedClientId?: NodeId, verifiedUserId?: string): Promise<FindFileResponse> => {
    const { hashAlg, hash } = request.payload

    return findFile({hashAlg, hash})
}

type CacheRecord = {
    timestampCreated: number,
    url: string, // signed download url
    fileRecord: FileRecord
}

const isCacheRecord = (x: any): x is CacheRecord => {
    return validateObject(x, {
        timestampCreated: isNumber,
        url: isNumber,
        fileRecord: isFileRecord
    })
}

const signedUrlObjectCache = new ObjectCache<CacheRecord>(1000 * 60 * 30)

// const checkFirestoreCache = async (cacheCollection: CollectionReference, cacheKey: string): Promise<CacheRecord | undefined> => {
//     const docRef = cacheCollection.doc(cacheKey)
//     const docSnapshot = await docRef.get()
//     if (!docSnapshot.exists) return undefined
//     const cacheRecord = docSnapshot.data()
//     if (!cacheRecord) return undefined
//     if (!isCacheRecord(cacheRecord)) {
//         console.warn('WARNING: Error in cache record')
//         return undefined
//     }
//     return cacheRecord
// }

const checkMongoCache = async (cacheCollection: Collection, cacheKey: string): Promise<CacheRecord | undefined> => {
    let result: any
    try {
        result = await cacheCollection.findOne({_id: cacheKey})
    }
    catch(err) {
        return undefined
    }
    const cacheRecord = {...result}
    delete cacheRecord['_id']
    if (!isCacheRecord(cacheRecord)) {
        console.warn('WARNING: Error in cache record')
        return undefined
    }
    return cacheRecord
}

// const setFirestoreCache = async (cacheCollection: CollectionReference, cacheKey: string, cacheRecord: CacheRecord) => {
//     const docRef = cacheCollection.doc(cacheKey)
//     await docRef.set(cacheRecord)
// }

const setMongoCache = async (cacheCollection: Collection, cacheKey: string, cacheRecord: CacheRecord) => {
    const doc = {...cacheRecord, _id: cacheKey}
    await cacheCollection.replaceOne({_id: cacheKey}, doc)
}

// const deleteFromFirestoreCache = async (cacheCollection: CollectionReference, cacheKey: string) => {
//     const docRef = cacheCollection.doc(cacheKey)
    
//     // we are assuming it doesn't throw exception if doesn't exist
//     await docRef.delete()
// }

const deleteFromMongoCache = async (cacheCollection: Collection, cacheKey: string) => {
    // we are assuming it doesn't throw exception if doesn't exist
    await cacheCollection.deleteOne({_id: cacheKey})
}

export const findFile = async (o: {hashAlg: string, hash: string, noFallback?: boolean}): Promise<FindFileResponse> => {
    const {hashAlg, hash} = o

    const bucket: Bucket = getBucket()
    const fallbackBucket: Bucket | undefined = getFallbackBucket()

    let fileRecord: FileRecord | undefined = undefined

    const h = hash
    const objectKey = `${hashAlg}/${h[0]}${h[1]}/${h[2]}${h[3]}/${h[4]}${h[5]}/${hash}`

    // const db = firestoreDatabase()
    // const cacheCollection = db.collection('kachery-gateway.findFileCache')
    const client = await getMongoClient()
    const cacheCollection = client.db('kachery-gateway').collection('findFileCache')

    // check cache
    const cacheKey = sha1OfString(`${bucket.uri}.${objectKey}`).toString()
    // first check in-memory cache
    let aa = signedUrlObjectCache.get(cacheKey) // check memory cache
    if (!aa) {
        // second check firestore cache
        // aa = await checkFirestoreCache(cacheCollection, cacheKey)
        aa = await checkMongoCache(cacheCollection, cacheKey)
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
            // await deleteFromFirestoreCache(cacheCollection, cacheKey) // delete from firestore cache
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
            // second set to firestore cache
            // await setFirestoreCache(cacheCollection, cacheKey, cacheRecord)
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
            // second set to firestore cache
            // await setFirestoreCache(cacheCollection, cacheKey, cacheRecord)
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