import * as fs from 'fs'
import { LogItem } from "../../src/types/LogItem"
import getS3Client from "./getS3Client"
import { Bucket, getObjectContent, listObjects } from "./s3Helpers"

const main = async () => {
    const wasabiCredentials = fs.readFileSync('wasabiCredentials.json', {encoding: 'utf-8'})
    const bucket = {uri: 'wasabi://kachery-cloud?region=us-east-1', credentials: wasabiCredentials}
    const s3Client = getS3Client(bucket)

    if (!fs.existsSync('logs')) {
        fs.mkdirSync('logs')
    }

    const logFiles = await listObjects(bucket, 'logs/')
    const logItemsList: LogItem[] = []
    for (let a of logFiles) {
        console.info(`Loading ${a.Key} (${a.Size})`)
        if (!fs.existsSync(a.Key)) {
            console.info('Downloading')
            const content = await getObjectContent(bucket, a.Key)
            fs.writeFileSync(a.Key, content)
        }
        const logItemsJson = fs.readFileSync(a.Key, 'utf-8')
        const logItems = JSON.parse(logItemsJson)
        logItemsList.push(logItems)
    }
    const allLogItems = logItemsList.flat(1)
    console.info(`Got ${allLogItems.length} log items`)

    let migratedFileCount = 0
    let migratedFileByteCount = 0
    for (let item of allLogItems) {
        if (item.request.type === 'migrateProjectFile') {
            migratedFileCount += 1
            migratedFileByteCount += item.request.fileRecord.size
        }
        // else {
        //     console.info(item.request.payload.type)
        // }
    }
    console.info(`Migrated ${migratedFileCount} project files, ${migratedFileByteCount / 1e9} GiB`)
}
main()