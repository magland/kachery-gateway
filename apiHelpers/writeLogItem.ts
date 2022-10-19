import { LogItem } from '../src/types/LogItem'
import firestoreDatabase from './common/firestoreDatabase'

const writeLogItem = async (logItem: LogItem) => {
    const db = firestoreDatabase()
    const logItemsCollection = db.collection('kachery-gateway.logItems')
    await logItemsCollection.add(logItem)
}

export default writeLogItem