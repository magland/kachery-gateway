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
								<TableCell>{JSONStringifyDeterministic(supressSignatureField(logItem.request), ' ')}</TableCell>
								<TableCell>{JSONStringifyDeterministic(logItem.response, ' ')}</TableCell>
								<TableCell>{JSONStringifyDeterministic(logItem.requestHeaders, ' ')}</TableCell>
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

// Thanks: https://stackoverflow.com/questions/16167581/sort-object-properties-and-json-stringify
export const JSONStringifyDeterministic = ( obj: any, space: string | number | undefined =undefined ) => {
    var allKeys: string[] = [];
    JSON.stringify( obj, function( key, value ){ allKeys.push( key ); return value; } )
    allKeys.sort();
    return JSON.stringify( obj, allKeys, space );
}

export default AdminPage
