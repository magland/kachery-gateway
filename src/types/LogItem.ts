import validateObject, { isNumber, isString, optional } from "./validateObject"

export type LogItem = {
    request: any
    response: any
    zone?: string
    requestTimestamp: number
    elapsed: number
    requestHeaders: any
}

export const isLogItem = (x: any): x is LogItem => {
    return validateObject(x, {
        request: () => (true),
        response: () => (true),
        zone: optional(isString),
        requestTimestamp: isNumber,
        elapsed: isNumber,
        requestHeaders: optional(() => (true))
    })
}