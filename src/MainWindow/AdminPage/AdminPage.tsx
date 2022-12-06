import { FunctionComponent } from "react";
import AdminConfigurationTab from "./AdminConfigurationTab/AdminConfigurationTab";
import AdminUsageTab from "./AdminUsageTab";
import AuthorizationSettingsTab from "./AuthorizationSettingsTab";
import TabWidget from "../TabWidget";

type Props ={
	width: number
	height: number
}

const tabs = [
	{label: 'Usage'},
	{label: 'Configuration'},
	{label: 'Authorization Settings'}
]

const AdminPage: FunctionComponent<Props> = ({width, height}) => {
	return (
		<TabWidget
			tabs={tabs}
			width={width}
			height={height}
		>
			<AdminUsageTab
				width={0}
				height={0}
			/>
			<AdminConfigurationTab
				width={0}
				height={0}
			/>
			<AuthorizationSettingsTab
				width={0}
				height={0}
			/>
		</TabWidget>
	)
}

export default AdminPage
