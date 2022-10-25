import { getAdminBucket, getBucket } from './getBucket'
import { getObjectContent, listObjects, parseBucketUri, putObject } from "./s3Helpers"

const moveLogsToAdminBucket = async () => {
    // const wasabiCredentials = fs.readFileSync('wasabiCredentials.json', {encoding: 'utf-8'})
    const bucket = getBucket()
    const adminBucket = getAdminBucket()

    // const {bucketName} = parseBucketUri(bucket.uri)
    const {bucketName: adminBucketName} = parseBucketUri(adminBucket.uri)

    const {objects: x} = await listObjects(bucket, 'logs/')
    for (let item of x) {
        console.info('===================================')
        console.info(item.Key)
        const content = await getObjectContent(bucket, item.Key)
        await putObject(adminBucket, {
            Body: content,
            Key: item.Key,
            Bucket: adminBucketName
        })
    }
}

moveLogsToAdminBucket()