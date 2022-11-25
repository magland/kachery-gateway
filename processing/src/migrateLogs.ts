import { getBucket, getFallbackBucket } from './getBucket'
import { getObjectContent, listObjects, objectExists, parseBucketUri, putObject } from "./s3Helpers"

const migrateLogs = async () => {
    const bucket = getBucket()
    const fallbackBucket = getFallbackBucket()
    if (!fallbackBucket) {
        console.info('No fallback bucket. Exiting.')
        return
    }
    const { bucketName } = parseBucketUri(bucket.uri)

    let continuationToken: string | undefined = undefined
    while (true) {
        const {objects: fallbackLogFiles, continuationToken: newContinuationToken} = await listObjects(fallbackBucket, 'logs/', {continuationToken, maxObjects: 500})
        for (let a of fallbackLogFiles) {
            console.info(`Checking ${a.Key} (${a.Size})`)
            const newKey = 'fallback-logs/' + a.Key.split('/').slice(1).join('/')
            const exists = await objectExists(bucket, newKey)
            if (!exists) {
                console.info(`Migrating ${a.Key} ${newKey}`)
                const logItemsJson = await getObjectContent(fallbackBucket, a.Key)
                await putObject(bucket, {
                    Bucket: bucketName,
                    Key: newKey,
                    Body: logItemsJson
                })
            }
        }
        if (!newContinuationToken) {
            break
        }
        else {
            continuationToken = newContinuationToken as string
        }
    }
}

migrateLogs()