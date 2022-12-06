import { FunctionComponent, useCallback, useState } from "react";
import Hyperlink from "../../../components/Hyperlink/Hyperlink";
import { useGithubAuth } from "../../../GithubAuth/useGithubAuth";
import { AdminActionRequest, isAdminActionResponse } from "../../../types/GuiRequest";
import guiApiRequest from "../../guiApiRequest";

type Props ={
	bucketUri?: string
}

const BucketCORSActionComponent: FunctionComponent<Props> = ({bucketUri}) => {
	const { userId, accessToken } = useGithubAuth()

	const [status, setStatus] = useState<'waiting' | 'running' | 'error' | 'completed'>('waiting')

	const [success, setSuccess] = useState(false)
	const handleAction = useCallback(() => {
		;(async () => {
			setStatus('running')
			const setErrorMessage = (msg: string) => {
				if (msg) setStatus('error')
			}
			const req: AdminActionRequest = {
                type: 'adminAction',
				actionType: 'setBucketCORS',
                auth: { userId, githubAccessToken: accessToken }
            }
            const resp = await guiApiRequest(req, { reCaptcha: false, setErrorMessage })
            if (!resp) return
            if (!isAdminActionResponse(resp)) {
                console.warn(resp)
                throw Error('Unexpected response')
            }
			setSuccess(resp.success)
			setStatus('completed')
		})()
	}, [accessToken, userId])

	return (
		<div>
			<p>CORS Configuration</p>
			{
				bucketUri?.startsWith('r2://') ? (
					<div>
						<p>The following action needs to be performed once to configure CORS on the Cloudflare storage bucket</p>
						<Hyperlink onClick={handleAction}>Set Cloudflare bucket CORS</Hyperlink>&nbsp;
						{
							status === 'waiting' ? <span /> :
							status === 'running' ? <span style={{color: 'orange'}}>running...</span> :
							status === 'error' ? <span style={{color: 'red'}}>error</span> :
							status === 'completed' ? <span style={{color: success ? 'green' : 'red'}}>{success ? "succeeded" : "error"}</span> :
							<span />
						}
					</div>
				) : (
					<span>Not a Cloudflare bucket</span>
				)
			}
		</div>
	)
}

export default BucketCORSActionComponent
