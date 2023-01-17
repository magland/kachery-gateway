import * as fs from 'fs'
import { loadGatewayConfig } from './GatewayConfig'
import { getBucket } from "./getBucket"
import { closeMongoClient, getMongoClient } from "./getMongoClient"
import { parseBucketUri, putObject } from "./s3Helpers"
import splitIntoBatches from "./splitIntoBatches"
import { isLogItem, LogItem } from "./types/LogItem"

const processLogItems = async () => {
    const gatewayConfig = await loadGatewayConfig()

    const client = await getMongoClient()

    for (let zz of gatewayConfig.zones) {
        const zone = zz.name
        console.info(`ZONE: ${zone}`)

        const bucket = await getBucket(zone)
        const {bucketName} = parseBucketUri(bucket.uri)

        const logItemsCollection = client.db('kachery-gateway').collection('logItems')
        while (true) {
            const logItems: LogItem[] = []
            let cursor = logItemsCollection.find({zone}).sort('requestTimestamp', 1).limit(1000)
            const results = await cursor.toArray()
            if (results.length === 0) {
                console.info('No more mongo log items to process. Exiting.')
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
            const objectKey = `logs/${fname}`
            console.info(`Writing ${fname}`)
            fs.writeFileSync(fname, logItemsJson)
            console.info(`Uploading log to admin bucket ${objectKey}`)
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

processLogItems()