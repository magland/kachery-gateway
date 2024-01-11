import validateObject, { isString } from "./types/validateObject"

export type ZoneInfo = {
    zone: string
    ownerId: string
    bucketName: string
    directory: string
}

export const isZoneInfo = (x: any): x is ZoneInfo => {
    return validateObject(x, {
        zone: isString,
        ownerId: isString,
        bucketName: isString,
        directory: isString
    })
}