import * as fs from 'fs'
import { JSONStringifyDeterministic } from '../../src/types/keypair'
import { getAdminBucket } from './getBucket'
import { parseBucketUri, putObject } from "./s3Helpers"

const uploadUsage = async () => {
    const adminBucket = getAdminBucket()

    const {bucketName: adminBucketName} = parseBucketUri(adminBucket.uri)

    const usageJson = fs.readFileSync('./usage.json', 'utf-8')
    const usage = JSON.parse(usageJson)
    console.info('Uploading usage/usage.json')
    await putObject(adminBucket, {
        Key: 'usage/usage.json',
        Body: JSONStringifyDeterministic(usage),
        Bucket: adminBucketName
    })
}

uploadUsage()