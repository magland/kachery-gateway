import { Table, TableBody, TableCell, TableRow } from "@material-ui/core";
import { FunctionComponent } from "react";
import BucketCORSActionComponent from "./BucketCORSActionComponent";
import TestComponent from "./TestComponent";
import useAdminConfiguration from "./useAdminConfiguration";

type Props ={
	width: number
	height: number
}

const AdminConfigurationTab: FunctionComponent<Props> = ({width, height}) => {
	const {adminConfiguration} = useAdminConfiguration()

	return (
		<div style={{position: 'absolute', width, height, overflowY: 'auto'}}>
			<h2>Configuration</h2>
			<Table>
				<TableBody>
					<TableRow>
						<TableCell>BUCKET_URI</TableCell>
						<TableCell>{adminConfiguration?.bucketUri}</TableCell>
					</TableRow>
					<TableRow>
						<TableCell>BUCKET_CREDENTIALS</TableCell>
						<TableCell>{abbreviate(adminConfiguration?.bucketCredentials)}</TableCell>
					</TableRow>
					<TableRow>
						<TableCell>FALLBACK BUCKET_URI</TableCell>
						<TableCell>{adminConfiguration?.fallbackBucketUri}</TableCell>
					</TableRow>
					<TableRow>
						<TableCell>FALLBACK_BUCKET_CREDENTIALS</TableCell>
						<TableCell>{abbreviate(adminConfiguration?.fallbackBucketCredentials)}</TableCell>
					</TableRow>
					<TableRow>
						<TableCell>MONGO_URI</TableCell>
						<TableCell>{abbreviate(adminConfiguration?.mongoUri)}</TableCell>
					</TableRow>
					<TableRow>
						<TableCell>REACT_APP_GITHUB_CLIENT_ID</TableCell>
						<TableCell>{adminConfiguration?.githubClientId}</TableCell>
					</TableRow>
					<TableRow>
						<TableCell>GITHUB_CLIENT_SECRET</TableCell>
						<TableCell>{abbreviate(adminConfiguration?.githubClientSecret)}</TableCell>
					</TableRow>
					<TableRow>
						<TableCell>REACT_APP_ADMIN_USERS</TableCell>
						<TableCell>{adminConfiguration?.adminUsers}</TableCell>
					</TableRow>
					<TableRow>
						<TableCell>KACHERY_ZONES</TableCell>
						<TableCell>{adminConfiguration?.kacheryZones}</TableCell>
					</TableRow>
					<TableRow>
						<TableCell>REACT_APP_RECAPTCHA_KEY</TableCell>
						<TableCell>{adminConfiguration?.reCaptchaKey}</TableCell>
					</TableRow>
					<TableRow>
						<TableCell>RECAPTCHA_SECRET_KEY</TableCell>
						<TableCell>{abbreviate(adminConfiguration?.reCaptchaSecretKey)}</TableCell>
					</TableRow>
				</TableBody>
			</Table>
			<h2>Actions</h2>
			<BucketCORSActionComponent
				bucketUri={adminConfiguration?.bucketUri}
			/>
			<h2>Tests</h2>
			<TestComponent
				label="Test bucket read/write"
				testType="bucketReadWrite"
			/>
			<TestComponent
				label="Test Mongo read/write"
				testType="mongoReadWrite"
			/>
		</div>
	)
}

const abbreviate = (x?: string) => {
	if (x === undefined) return x
	// return x.length > 10 ? x.slice(0, 10) + '...' : x
	return x.length > 10 ? x.slice(0, 10) : x
}

export default AdminConfigurationTab
