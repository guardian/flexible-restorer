import React from "react";

/*
initial file generated with AI:
Read the Angular template in restore-list.html and convert it to a react component, to be outputted in RestoreList.tsx. For the elements with custom names starting with "gu-", create supporting react components, for example "<gu-column>" becomes "<GuColoumn>". Infer what you can about how the supporting components should behave based on the files imported from gu-components.js

(follow up)
just split the component to a separate files, do not worry about unit tests for them

*/

export const GuRow: React.FC<
    React.HTMLAttributes<HTMLDivElement> & { variant?: string }
> = ({ children, className, variant, ...rest }) => (
    <div
        className={["gu-row", variant ? `gu-row--${variant}` : "", className]
            .filter(Boolean)
            .join(" ")}
        {...rest}
    >
        {children}
    </div>
);

export const GuColumn: React.FC<
    React.HTMLAttributes<HTMLDivElement> & { span?: number | string }
> = ({ children, className, span, ...rest }) => (
    <div
        className={["gu-column", span ? `span-${span}` : "", className]
            .filter(Boolean)
            .join(" ")}
        {...rest}
    >
        {children}
    </div>
);

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

export const GuBtn: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({
    children,
    ...rest
}) => (
    <button
        {...rest}
        className={["gu-btn", (rest.className as string) || ""]
            .filter(Boolean)
            .join(" ")}
    >
        {children}
    </button>
);

export const GuIcon: React.FC<{ variant?: string; className?: string }> = ({
    variant,
    className,
}) => (
    <span
        className={["gu-icon", variant ? `gu-icon--${variant}` : "", className]
            .filter(Boolean)
            .join(" ")}
    ></span>
);

export const GuLoadingBars: React.FC = () => (
    <div className="gu-loading-bars">Loading…</div>
);

export default {
    GuRow,
    GuColumn,
    GuBox,
    GuBtn,
    GuIcon,
    GuLoadingBars,
};
