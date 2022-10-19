import { useMemo, useState } from 'react'
import { ErrorMessageData } from './ErrorMessageContext'

const useSetupErrorMessage = (): ErrorMessageData => {
    const [errorMessage, setErrorMessage] = useState<string>('')
    const errorMessageData = useMemo(() => ({
        errorMessage,
        setErrorMessage
    }), [errorMessage])
    return errorMessageData
}

export default useSetupErrorMessage