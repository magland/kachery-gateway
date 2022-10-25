import { FileRecord } from '../../src/types/FileRecord'
import { FindFileRequest, FindFileResponse } from "../../src/types/GatewayRequest"
import { NodeId } from "../../src/types/keypair"
import firestoreDatabase from '../common/firestoreDatabase'
import { HeadObjectOutputX } from "./getS3Client"
import { getBucket } from "./initiateFileUploadHandler"
import { formBucketObjectUrl, headObject } from "./s3Helpers"

const findFileHandler = async (request: FindFileRequest, verifiedClientId: NodeId): Promise<FindFileResponse> => {
    const { hashAlg, hash } = request.payload

    return findFile({hashAlg, hash})
}

export const findFile = async (o: {hashAlg: string, hash: string}): Promise<FindFileResponse> => {
    const {hashAlg, hash} = o

    const bucket = getBucket()

    let cacheHit = false
    let fileRecord: FileRecord | undefined = undefined

    // for when we want to keep a cache in firestore
    // const db = firestoreDatabase()
    // const filesCollection = db.collection('kachery-gateway.files')
    // const querySnapshot = await filesCollection.where('hash', '==', hash).get()
    // for (let doc of querySnapshot.docs) {
    //     const rec = doc.data()
    //     if (!isFileRecord(rec)) {
    //         throw Error('Invalid file record in database')
    //     }
    //     if (rec.hashAlg === hashAlg) {
    //         fileRecord = rec
    //         cacheHit = true
    //         break
    //     }
    // }

    if (!fileRecord) {
        const h = hash
        const key0 = `${hashAlg}/${h[0]}${h[1]}/${h[2]}${h[3]}/${h[4]}${h[5]}/${hash}`
        const objectKeys = [
            key0, // check root directory
            `uploads/${key0}` // check uploads directory
        ]
        for (let objectKey of objectKeys) {
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
                // for when we want to keep a cache in firestore
                // await filesCollection.add(fileRecord)
                break
            }
        }
    }

    // if (!fileRecord) {
    //     // check the old system while we are in the process of migrating

    //     const db = firestoreDatabase()
    //     const filesCollection = db.collection('kacherycloud.files')
    //     const uri = `${hashAlg}://${hash}`
    //     const filesResult = await filesCollection.where('uri', '==', uri).orderBy('timestampCreated').get()
    //     // const filesResult = await filesCollection.where('uri', '==', uri).get()
    //     if (filesResult.docs.length === 0) {
    //         return {
    //             type: 'findFile',
    //             found: false
    //         }
    //     }
    //     else {
    //         const fileData = filesResult.docs[0].data() // the first doc is the earliest because we ordered by timestampCreated
    //         // note that this is a fileRecord in the old system, not the new!!
    //         //     projectId: string
    //         //     hashAlg: string
    //         //     hash: string
    //         //     uri: string
    //         //     size: number
    //         //     url: string
    //         //     timestampCreated?: number // only optional for backward-compatibility
    //         //     timestampAccessed?: number // only optional for backward-compatibility
    //         // }
    //         const h = hash
    //         fileRecord = {
    //             hashAlg,
    //             hash,
    //             size: fileData.size,
    //             bucketUri: bucket.uri,
    //             objectKey: `projects/${fileData.projectId}/${hashAlg}/${h[0]}${h[1]}/${h[2]}${h[3]}/${h[4]}${h[5]}/${h}`,
    //             timestamp: fileData.timestampCreated
    //         }
    //     }
    // }

    if (!fileRecord) {
        return {
            type: 'findFile',
            found: false
        }
    }

    // report last accessed
    const uri = `${hashAlg}:${hash}`
    const db = firestoreDatabase()
    const collection = db.collection('kachery-gateway.filesAccessed')
    await collection.doc(uri).set({
        hashAlg,
        hash,
        timestamp: Date.now()
    })

    return {
        type: 'findFile',
        found: true,
        size: fileRecord.size,
        bucketUri: fileRecord.bucketUri,
        objectKey: fileRecord.objectKey,
        url: formBucketObjectUrl(bucket, fileRecord.objectKey),
        cacheHit
    }
}

export default findFileHandler