import * as fs from 'fs'
import { LogItem } from "../../src/types/LogItem"
import getS3Client from "./getS3Client"
import { getObjectContent } from "./s3Helpers"
import sleepMsec from "./sleepMsec"

const main = async () => {
    const wasabiCredentials = fs.readFileSync('wasabiCredentials.json', {encoding: 'utf-8'})
    const bucket = {uri: 'wasabi://kachery-cloud?region=us-east-1', credentials: wasabiCredentials}
    const s3Client = getS3Client(bucket)
    await sleepMsec(500)

    const listObjects = async (prefix: string): Promise<{Key: string, Size: number}[]> => {
        return new Promise((resolve, reject) => {
            s3Client.listObjects({
                Bucket: 'kachery-cloud',
                Prefix: prefix
            }, (err, data) => {
                if (err) {
                    reject(err)
                    return
                }
                resolve(data.Contents as any[])
            })
        })
    }

    const logFiles = await listObjects('logs/')
    const logItemsList: LogItem[] = []
    for (let a of logFiles) {
        console.info(`Loading ${a.Key} (${a.Size})`)
        // if (a.Size < 1000000) {
        const logItemsJson = await getObjectContent(bucket, a.Key)
        const logItems = JSON.parse(logItemsJson)
        logItemsList.push(logItems)
        // }
    }
    const allLogItems = logItemsList.flat(1)
    console.info(`Got ${allLogItems.length} log items`)

    let count = 0
    for (let item of allLogItems) {
        if (item.request.type === 'migrateProjectFile') {
            count++
        }
        else {
            console.info(item.request.payload.type)
        }
    }
    console.info(`Migrated ${count} project files`)
}
main()