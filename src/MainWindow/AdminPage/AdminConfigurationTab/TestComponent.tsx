import { FunctionComponent, useCallback, useState } from "react";
import Hyperlink from "../../../components/Hyperlink/Hyperlink";
import { useGithubAuth } from "../../../GithubAuth/useGithubAuth";
import { isTestConfigurationResponse, TestConfigurationRequest } from "../../../types/GuiRequest";
import guiApiRequest from "../../guiApiRequest";
import useRoute from "../../useRoute";

type Props ={
	label: string
	testType: string
}

const TestComponent: FunctionComponent<Props> = ({label, testType}) => {
	const { userId, accessToken } = useGithubAuth()

	const [status, setStatus] = useState<'waiting' | 'running' | 'error' | 'completed'>('waiting')
	const [elapsed, setElapsed] = useState(-1)

	const [result, setResult] = useState<string>('')
	const [passed, setPassed] = useState<boolean>()

	const {route} = useRoute()

	const handleTest = useCallback(() => {
		;(async () => {
			setStatus('running')
			const setErrorMessage = (msg: string) => {
				if (msg) setStatus('error')
			}
			const req: TestConfigurationRequest = {
                type: 'testConfiguration',
				testType,
				zone: route.zone,
                auth: { userId, githubAccessToken: accessToken }
            }
			const timer = Date.now()
            const resp = await guiApiRequest(req, { reCaptcha: false, setErrorMessage })
			setElapsed(Date.now() - timer)
            if (!resp) return
            if (!isTestConfigurationResponse(resp)) {
                console.warn(resp)
                throw Error('Unexpected response')
            }
			setPassed(resp.passed)
			setResult(resp.result)
			setStatus('completed')
		})()
	}, [accessToken, userId, testType, route.zone])

	return (
		<div>
			<Hyperlink onClick={handleTest}>{label}</Hyperlink>:&nbsp;
			{
				status === 'waiting' ? <span /> :
				status === 'running' ? <span style={{color: 'orange'}}>running...</span> :
				status === 'error' ? <span style={{color: 'red'}}>error</span> :
				status === 'completed' ? <span style={{color: passed ? 'green' : 'red'}}>{result} (elapsed (ms): {elapsed})</span> :
				<span />
			}
		</div>
	)
}

export default TestComponent
