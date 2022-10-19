import React, { FunctionComponent, PropsWithChildren } from 'react';
import ErrorMessageContext from './ErrorMessageContext';
import useSetupErrorMessage from './useSetupErrorMessage';

const ErrorMessageSetup: FunctionComponent<PropsWithChildren> = ({children}) => {
    const errorMessageData = useSetupErrorMessage()
    return (
        <ErrorMessageContext.Provider value={errorMessageData}>
            {children}
        </ErrorMessageContext.Provider>
    )
}

export default ErrorMessageSetup