import * as fs from 'fs'
import { LogItem } from "./types/LogItem"
import { getAdminBucket } from './getBucket'
import { getObjectContent, listObjects } from "./s3Helpers"

const downloadLogs = async () => {
    const adminBucket = getAdminBucket()
    // const s3Client = getS3Client(bucket)

    if (!fs.existsSync('logs')) {
        fs.mkdirSync('logs')
    }

    let continuationToken: string | undefined = undefined
    while (true) {
        const {objects: logFiles, continuationToken: newContinuationToken} = await listObjects(adminBucket, 'logs/', {continuationToken, maxObjects: 500})
        const logItemsList: LogItem[] = []
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
        const allLogItems = logItemsList.flat(1)
        console.info(`Got ${allLogItems.length} log items`)

        if (!newContinuationToken) {
            break
        }
        else {
            continuationToken = newContinuationToken as string
        }
    }
}
downloadLogs()