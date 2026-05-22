import { Favicon } from "@guardian/stand/Favicon";
import { Layout } from "@guardian/stand/Layout";
import {
    TopBar,
    TopBarContainerLeft,
    TopBarItem,
    TopBarToolName,
} from "@guardian/stand/TopBar";
import { Avatar } from "@guardian/stand/Avatar";
import { type ReactNode } from "react";
import { RestorerIcon } from "./RestorerIcon";
import { type UserData } from "../useUser";

/*

file set up mamually

prompts used:
pass the user value as a prop to MainLayout and use it to include an Avatar component in the TopBar , following the guidance at https://guardian.github.io/stand/?path=/docs/stand-tools-design-system-components-avatar--docs

*/

interface Props {
    children: ReactNode;
    user?: UserData | null;
    contentId?: string;
}

const getInitials = (user: UserData): string => {
    const firstName = user.firstName?.[0] ?? "";
    const lastName = user.lastName?.[0] ?? "";
    return `${firstName}${lastName}`.toUpperCase() || "U";
};

export const MainLayout = ({ children, user, contentId }: Props) => {
    return (
        <>
            <TopBar>
                <TopBarToolName
                    name="Flexible Restorer"
                    favicon={{ icon: <Favicon icon={<RestorerIcon />} /> }}
                />
                <TopBarContainerLeft>
                    {contentId && <TopBarItem>{contentId}</TopBarItem>}
                </TopBarContainerLeft>
                {user && (
                    <Avatar
                        src={user.avatarUrl}
                        alt={
                            `${user.firstName} ${user.lastName}`.trim() ||
                            user.email
                        }
                        initials={getInitials(user)}
                        size="md"
                    />
                )}
            </TopBar>
            <Layout>{children}</Layout>
        </>
    );
};
