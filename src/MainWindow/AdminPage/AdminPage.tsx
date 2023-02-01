import { FunctionComponent } from "react";
import AdminConfigurationTab from "./AdminConfigurationTab/AdminConfigurationTab";
import AdminUsageTab from "./AdminUsageTab";
import AuthorizationSettingsTab from "./AuthorizationSettingsTab";
import TabWidget from "../TabWidget";
import { useIsAdminForZone } from "../LeftPanel";

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
	const isAdminForZone = useIsAdminForZone()

	if (!isAdminForZone) {
		return <div>User does not have admin access to zone.</div>
	}
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
