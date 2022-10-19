import React from 'react'

export type ErrorMessageData = {
    errorMessage: string
    setErrorMessage: (msg: string) => void
}

const ErrorMessageContext = React.createContext<ErrorMessageData>({errorMessage: '', setErrorMessage: () => {}})

export default ErrorMessageContext