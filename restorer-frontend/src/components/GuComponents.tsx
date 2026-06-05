import React from "react";

/*
initial file generated with AI:
Read the Angular template in restore-list.html and convert it to a react component, to be outputted in RestoreList.tsx. For the elements with custom names starting with "gu-", create supporting react components, for example "<gu-column>" becomes "<GuColoumn>". Infer what you can about how the supporting components should behave based on the files imported from gu-components.js

(follow up)
just split the component to a separate files, do not worry about unit tests for them

*/


export const GuBox: React.FC<
    React.HTMLAttributes<HTMLDivElement> & { variant?: string }
> = ({ children, className, variant, ...rest }) => (
    <div
        className={["gu-box", variant ? `gu-box--${variant}` : "", className]
            .filter(Boolean)
            .join(" ")}
        {...rest}
    >
        {children}
    </div>
);

export const GuLoadingBars: React.FC = () => (
    <div className="gu-loading-bars">Loading…</div>
);

export default {
    GuBox,
    GuLoadingBars,
};
