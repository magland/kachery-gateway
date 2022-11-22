import { PutObjectRequest } from "aws-sdk/clients/s3";
import getS3Client, { HeadObjectOutputX } from "./getS3Client";

export type Bucket = {
    uri: string // e.g., wasabi://kachery-cloud?region=us-east-1
    credentials: string
}

export const bucketNameFromUri = (uri: string) => {
    if (!uri) return ''
    return uri.split('?')[0].split('/')[2] as string
}

export const putObject = async (bucket: Bucket, params: PutObjectRequest): Promise<{cid: string}> => {
    return new Promise<{cid: string}>((resolve, reject) => {
        const s3 = getS3Client(bucket)
        const request = s3.putObject(params)
        request.on('error', (err: Error) => {
            reject(new Error(`Error uploading to bucket: ${err.message}`)) 
        })
        request.on('httpHeaders', (statusCode, headers, response, statusMessage) => {
            if (statusCode !== 200) {
                reject(`Error uploading to bucket * (${statusCode}): ${statusMessage}`)
                return
            }
            const cid = headers['x-amz-meta-cid']
            
            resolve({cid})
        })
        request.send()
    })
}

export const headObject = async (bucket: Bucket, key: string): Promise<HeadObjectOutputX> => {
    return new Promise<any>((resolve, reject) => {
        const s3 = getS3Client(bucket)
        s3.headObject({
            Bucket: bucketNameFromUri(bucket.uri),
            Key: key
        }, (err: Error, data) => {
            if (err) {
                reject(new Error(`Error getting metadata for object: ${err.message}`))
                return
            }
            resolve(data)
        })
    })
}

export const getObjectContent = async (bucket: Bucket, key: string): Promise<any> => {
    return new Promise((resolve, reject) => {
        const s3 = getS3Client(bucket)
        s3.getObject({
            Bucket: bucketNameFromUri(bucket.uri),
            Key: key
        }, (err, data) => {
            if (err) {
                reject(new Error(`Error getting metadata for object: ${err.message}`))
                return
            }
            resolve(data.Body)
        })
    })
}

export const deleteObject = async (bucket: Bucket, key: string): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
        const s3 = getS3Client(bucket)
        s3.deleteObject({
            Bucket: bucketNameFromUri(bucket.uri),
            Key: key
        }, (err) => {
            if (err) {
                reject(new Error('Problem deleting object'))
            }
            else {
                resolve()
            }
        })
    })
}

export const copyObject = async (bucket: Bucket, srcKey: string, dstKey: string): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
        const s3 = getS3Client(bucket)
        const bucketName = bucketNameFromUri(bucket.uri)
        s3.copyObject({
            Bucket: bucketName,
            CopySource: `${bucketName}/${srcKey}`,
            Key: dstKey
        }, (err) => {
            if (err) {
                reject(new Error('Problem copying object'))
            }
            else {
                resolve()
            }
        })
    })
}

export const objectExists = async (bucket: Bucket, key: string): Promise<boolean> => {
    return new Promise<boolean>((resolve, reject) => {
        const s3 = getS3Client(bucket)
        s3.headObject({
            Bucket: bucketNameFromUri(bucket.uri),
            Key: key
        }, (err, data) => {
            if (err) {
                if (err.statusCode === 404) { // not found
                    resolve(false)
                }
                else {
                    reject(new Error('Unexpected status code for headObject'))
                }
            }
            else {
                resolve(true)
            }
        })
    })
}

export const getSignedUploadUrl = async (bucket: Bucket, key: string): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
        const s3 = getS3Client(bucket)
        s3.getSignedUrl('putObject', {
            Bucket: bucketNameFromUri(bucket.uri),
            Key: key,
            Expires: 60 * 30 // seconds
        }, (err, url) => {
            if (err) {
                reject(new Error(`Error getting signed url: ${err.message}`))
                return
            }
            if (!url) {
                reject(new Error('Unexpected, url is undefined'))
                return
            }
            resolve(url)
        })
    })
}

export const getSignedDownloadUrl = async (bucket: Bucket, key: string, expiresSec: number): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
        const s3 = getS3Client(bucket)
        s3.getSignedUrl('getObject', {
            Bucket: bucketNameFromUri(bucket.uri),
            Key: key,
            Expires: expiresSec
        }, (err, url) => {
            if (err) {
                reject(new Error(`Error getting signed url: ${err.message}`))
                return
            }
            if (!url) {
                reject(new Error('Unexpected, url is undefined'))
                return
            }
            resolve(url)
        })
    })
}

export const parseBucketUri = (uri: string) => {
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
    const service0 = (aa.split('/')[0] || '').split(':')[0] || ''
    const service = service0 === 'wasabi' ? 'wasabi' : service0 === 'gs' ? 'google' : service0 === 's3' ? 'aws' : service0 === 'r2' ? 'r2' : service0
    const bucketName = aa.split('/')[2] || ''
    const path = aa.split('/').slice(3).join('/')
    return {region, service, bucketName, path}
}

export const formBucketObjectUrl = (bucket: Bucket, objectKey: string) => {
    const {service, region, bucketName} = parseBucketUri(bucket.uri)

    let bucketBaseUrl: string
    if (service === 'aws') {
        bucketBaseUrl = `https://${bucketName}.s3.amazonaws.com`
    }
    else if (service === 'wasabi') {
        bucketBaseUrl = `https://s3.${region || 'us-east-1'}.wasabisys.com/${bucketName}`
    }
    else if (service === 'r2') {
        bucketBaseUrl = '' // not used
    }
    else if (service === 'google') {
        bucketBaseUrl = `https://storage.googleapis.com/${bucketName}`
    }
    else {
        throw Error(`Unsupported service: ${service}`)
    }

    return `${bucketBaseUrl}/${objectKey}`
}

export const listObjects = async (bucket: Bucket, prefix: string, o: {continuationToken?: string, maxObjects?: number}={}): Promise<{objects: {Key: string, Size: number}[], continuationToken: string | undefined}> => {
    const {bucketName} = parseBucketUri(bucket.uri)
    return new Promise((resolve, reject) => {
        const s3Client = getS3Client(bucket)
        s3Client.listObjectsV2({
            Bucket: bucketName,
            Prefix: prefix,
            ContinuationToken: o.continuationToken,
            MaxKeys: o.maxObjects
        }, (err, data) => {
            if (err) {
                reject(err)
                return
            }
            resolve({objects: data.Contents as {Key: string, Size: number}[], continuationToken: data.IsTruncated ? data.NextContinuationToken : undefined})
        })
    })
}