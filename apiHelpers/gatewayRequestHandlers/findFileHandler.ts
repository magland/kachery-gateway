import { FindFileRequest, FindFileResponse } from "../../src/types/GatewayRequest"
import { NodeId } from "../../src/types/keypair"
import firestoreDatabase from "../common/firestoreDatabase"
import gatewayConfig from "../common/gatewayConfig"
import { FileRecord, isFileRecord } from '../../src/types/FileRecord'
import axios from "axios"

const findFileHandler = async (request: FindFileRequest, verifiedClientId: NodeId): Promise<FindFileResponse> => {
    const { hashAlg, hash, bucketHints } = request.payload

    const db = firestoreDatabase()

    const filesCollection = db.collection('kachery-gateway.files')
    const querySnapshot = await filesCollection.where('hash', '==', hash).get()
    let fileRecord: FileRecord | undefined = undefined
    let cacheHit = false
    for (let doc of querySnapshot.docs) {
        const rec = doc.data()
        if (!isFileRecord(rec)) {
            throw Error('Invalid file record in database')
        }
        if (rec.hashAlg === hashAlg) {
            fileRecord = rec
            cacheHit = true
            break
        }
    }
    if (!fileRecord) {
        const buckets = [...gatewayConfig.buckets].sort((b1, b2) => {
            if (bucketHints) {
                if ((bucketHints.includes(b1.uri)) && (!bucketHints.includes(b2.uri))) {
                    return -1
                }
                else if ((bucketHints.includes(b2.uri)) && (!bucketHints.includes(b1.uri))) {
                    return 1
                }
                else return 0
            }
            else return 0
        })
        for (let b of buckets) {
            const url = formFileUrl({bucketUri: b.uri, hashAlg, hash})
            const resp = await axios.head(url)
            if (resp.status === 200) {
                const size = parseInt(resp.headers["content-length"] || "0")
                fileRecord = {
                    hashAlg,
                    hash,
                    bucketUri: b.uri,
                    size,
                    timestamp: Date.now()
                }
                await filesCollection.add(fileRecord)
                break
            }
        }
    }

    if (!fileRecord) {
        return {
            type: 'findFile',
            found: false
        }
    }

    return {
        type: 'findFile',
        found: true,
        size: fileRecord.size,
        bucketUri: fileRecord.bucketUri,
        url: formFileUrl({bucketUri: fileRecord.bucketUri, hashAlg, hash}),
        cacheHit
    }
}

const formFileUrl = (o: {bucketUri: string, hashAlg: string, hash: string}) => {
    const {bucketUri, hashAlg, hash} = o

    const {region, service, bucketName, path} = parseBucketUri(bucketUri)
    let bucketBaseUrl: string
    if (service === 'aws') {
        bucketBaseUrl = `https://${bucketName}.s3.amazonaws.com`
    }
    else if (service === 'wasabi') {
        bucketBaseUrl = `https://s3.${region || 'us-east-1'}.wasabisys.com/${bucketName}`
    }
    else if (service === 'google') {
        bucketBaseUrl = `https://storage.googleapis.com/${bucketName}`
    }
    else {
        throw Error(`Unsupported service: ${service}`)
    }

    let baseUrl = bucketBaseUrl
    if (path) {
        baseUrl += '/' + path
    }

    const s = hash
    return `${baseUrl}/sha1/${s[0]}${s[1]}/${s[2]}${s[3]}/${s[4]}${s[5]}/${s}`
}

const parseBucketUri = (uri: string) => {
    let ind = uri.indexOf('?')
    if (ind < 0) ind = uri.length
    const aa = uri.slice(0, ind)
    const qq = uri.slice(ind + 1)
    const query: {[key: string]: string} = {}
    for (let part of qq.split('&')) {
        const kk = part.split('=')[0] || ''
        const vv = part.split('=')[1] || ''
        if ((kk) && (vv)) {
            query[kk] = vv
        }
    }
    const region = query['region'] || ''
    const service = (aa.split('/')[0] || '').split(':')[0] || ''
    const bucketName = aa.split('/')[2] || ''
    const path = aa.split('/').slice(3).join('/')
    return {region, service, bucketName, path}
}

export default findFileHandler