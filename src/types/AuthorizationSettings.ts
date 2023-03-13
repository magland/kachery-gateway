import validateObject, { isArrayOf, isBoolean, isString, optional } from "./validateObject"

export type AuthorizationSettings = {
    allowPublicUpload: boolean
    allowPublicDownload?: boolean
    authorizedUsers: {
        userId: string
        upload?: boolean
        admin?: boolean
        download?: boolean
    }[]
}

export const isAuthorizationSettings = (x: any): x is AuthorizationSettings => {
    return validateObject(x, {
        allowPublicUpload: isBoolean,
        allowPublicDownload: optional(isBoolean),
        authorizedUsers: isArrayOf(y => (validateObject(y, {
            userId: isString,
            upload: optional(isBoolean),
            admin: optional(isBoolean),
            download: optional(isBoolean)
        })))
    })
}