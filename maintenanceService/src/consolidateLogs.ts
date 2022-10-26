import * as fs from 'fs'
import { getAdminBucket } from './getBucket'
import { getObjectContent, listObjects, parseBucketUri, putObject } from "./s3Helpers"
import { JSONStringifyDeterministic } from './types/keypair'
import { LogItem } from "./types/LogItem"

const downloadLogs = async () => {
    const adminBucket = getAdminBucket()
    const {bucketName: adminBucketName} = parseBucketUri(adminBucket.uri)

    if (!fs.existsSync('logs')) {
        fs.mkdirSync('logs')
    }

    let continuationToken: string | undefined = undefined
    const logItemsList: LogItem[] = []
    while (true) {
        const {objects: logFiles, continuationToken: newContinuationToken} = await listObjects(adminBucket, 'logs/', {continuationToken, maxObjects: 500})
        
        for (let a of logFiles) {
            console.info(`Loading ${a.Key} (${a.Size})`)
            if (!fs.existsSync(a.Key)) {
                console.info('Downloading')
                const content = await getObjectContent(adminBucket, a.Key)
                fs.writeFileSync(a.Key, content)
            }
            const logItemsJson = fs.readFileSync(a.Key, 'utf-8')
            const logItems = JSON.parse(logItemsJson)
            logItemsList.push(logItems)
        }

        if (!newContinuationToken) {
            break
        }
        else {
            continuationToken = newContinuationToken as string
        }
    }
    const allLogItems = logItemsList.flat(1)
    console.info(`Got ${allLogItems.length} log items`)

    const newLogItems: LogItem[] = []
    const unhandledTypes = new Set<string>()
    for (let x of allLogItems) {
        const type0 = x.request.type || (x.request.payload || {}).type
        if ([
            "initiateFileUpload",
            "finalizeFileUpload",
            "addClient",
            "deleteClient",
            "setClientInfo",
            "migrateClient",
            "migrateProjectFile"
        ].includes(type0)) {
            newLogItems.push(x)
        }
        else if (type0 === 'acceptUpload') {
            newLogItems.push({
                elapsed: x.elapsed,
                request: {
                    type: "verifyUpload",
                    hashAlg: x.request.hashAlg,
                    hash: x.request.hash,
                    size: x.request.size
                },
                requestHeaders: {},
                requestTimestamp: x.requestTimestamp,
                response: {}
            })
        }
        else {
            unhandledTypes.add(type0)
        }
    }
    console.info(`Num. new log items: ${newLogItems.length}`)
    console.info('---- unhandled types')
    console.info(unhandledTypes)

    console.info('=================================================')
    const logItemsJson = JSON.stringify(newLogItems)
    const ts = new Date().toISOString()
    const fname = `log-${ts}.json`
    const objectKey = `logs/${fname}`
    console.info(`Writing ${fname}`)
    fs.writeFileSync(fname, logItemsJson)
    console.info(`Uploading log to admin bucket ${objectKey}`)
    await putObject(adminBucket, {
        Body: logItemsJson,
        Key: objectKey,
        Bucket: adminBucketName
    })
}
downloadLogs()