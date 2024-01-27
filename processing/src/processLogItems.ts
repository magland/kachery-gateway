import * as fs from 'fs'
import { closeMongoClient, getMongoClient } from "./getMongoClient"
import { getZoneData, joinKeys } from './getZoneInfo'
import { listObjects, parseBucketUri, putObject } from "./s3Helpers"
import splitIntoBatches from "./splitIntoBatches"
import { LogItem, isLogItem } from "./types/LogItem"

const processLogItems = async () => {
    const client = await getMongoClient()

    const zoneNames = await getRegisteredZoneNames()

    for (const zoneName of zoneNames) {
        console.info(`ZONE: ${zoneName}`)

        const zoneData = await getZoneData(zoneName)

        const bucket = zoneData.bucket
        const {bucketName} = parseBucketUri(bucket.uri)

        const logItemsCollection = client.db('kachery-gateway').collection('logItems')
        while (true) {
            const logItems: LogItem[] = []
            let cursor = logItemsCollection.find({zone: zoneName}).sort('requestTimestamp', 1).limit(1000)
            const results = await cursor.toArray()
            if (results.length === 0) {
                console.info('No more mongo log items to process.')
                break
            }
            for (let result of results) {
                const logItem = {...result}
                delete (logItem as any)['_id']
                if (!isLogItem(logItem)) {
                    console.warn(logItem)
                    throw Error('Invalid log item in database')
                }
                const type0 = logItem.request.type || (logItem.request.payload || {}).type
                if ([
                    "initiateFileUpload",
                    "finalizeFileUpload",
                    "findFile",
                    "deleteFile",
                    "addClient",
                    "deleteClient",
                    "setClientInfo",
                    "addResource",
                    "deleteResource",
                    "setResourceInfo",
                    "migrateClient",
                    "migrateProjectFile"
                ].includes(type0)) {
                    logItems.push(logItem)
                }
                else {
                    if (type0 === 'getZoneInfo') {
                        console.warn(`WARNING: Unexpected log item type: ${type0}`)
                    }
                    else {
                        throw Error(`Unexpected log item type: ${type0}`)
                    }
                }
                // console.info(new Date(logItem.requestTimestamp).toISOString())
            }

            console.info('=================================================')
            console.info(`Processing ${logItems.length} mongo log items.`)
            const logItemsJson = JSON.stringify(logItems) // deterministic stringify can be slow here
            const ts = new Date().toISOString()
            const fname = `log-${ts}.json`
            const objectKey = joinKeys(zoneData.directory, `logs/${fname}`)
            console.info(`Writing ${fname}`)
            fs.writeFileSync(fname, logItemsJson)
            console.info(`Uploading log to bucket ${objectKey}`)
            await putObject(bucket, {
                Body: logItemsJson,
                Key: objectKey,
                Bucket: bucketName
            })
            console.info('Deleting mongo log items')
            // delete 50 at a time
            const idBatches = splitIntoBatches(results.map(r => (r._id)), 50)
            for (let ids of idBatches) {
                console.info(`Deleting batch of ${ids.length}`)
                await logItemsCollection.deleteMany({
                    _id: {$in: ids}
                })
            }
            console.info(`Processed ${logItems.length} mongo log items.`)
        }
    }
    closeMongoClient()
}

export const getRegisteredZoneNames = async () => {
    const defaultZoneData = await getZoneData('default')
    const defaultBucket = defaultZoneData.bucket
    const ret: string[] = []

    // these are hard-coded for now
    for (const zn of [
        'default', 'franklab.default', 'franklab.collaborators', 'franklab.public', 'aind'
    ]) {
        ret.push(zn)
    }

    let continuationToken: string | undefined = undefined
    while (true) {
        const aa: {
            objects: {
                Key: string;
                Size: number;
            }[];
            continuationToken: string | undefined;
        } = await listObjects(defaultBucket, `registered-zones/`, {continuationToken, maxObjects: 500})
        const {objects: registeredZoneObjects, continuationToken: newContinuationToken} = aa
        for (let obj of registeredZoneObjects) {
            const zoneName = obj.Key.split('/')[1]
            ret.push(zoneName)
        }
        if (!newContinuationToken) break
        continuationToken = newContinuationToken
    }
    return ret
}

processLogItems()