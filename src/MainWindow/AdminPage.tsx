import { Button, Table, TableBody, TableCell, TableHead, TableRow } from "@material-ui/core";
import { FunctionComponent } from "react";
import useRecentActivity from "./useRecentActivity";

type Props ={
	width: number
	height: number
}

const AdminPage: FunctionComponent<Props> = () => {
	const {logItems, refreshRecentActivity} = useRecentActivity()
	return (
		<div>
			<Button onClick={refreshRecentActivity}>Refresh</Button>
			<Table>
				<TableHead>
					<TableRow>
						<TableCell>Timestamp</TableCell>
						<TableCell>Elapsed</TableCell>
						<TableCell>Request</TableCell>
						<TableCell>Response</TableCell>
						<TableCell>Headers</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					{
						(logItems || []).map((logItem, ii) => (
							<TableRow key={ii}>
								<TableCell>{logItem.requestTimestamp}</TableCell>
								<TableCell>{logItem.elapsed}</TableCell>
								<TableCell>{JSON.stringify(supressSignatureField(logItem.request), null, 4)}</TableCell>
								<TableCell>{JSON.stringify(logItem.response, null, 4)}</TableCell>
								<TableCell>{JSON.stringify(logItem.requestHeaders, null, 4)}</TableCell>
							</TableRow>
						))
					}
				</TableBody>
			</Table>
		</div>
	)
}

const supressSignatureField = (x: any) => {
	return {...x, signature: '...'}
}

export default AdminPage
