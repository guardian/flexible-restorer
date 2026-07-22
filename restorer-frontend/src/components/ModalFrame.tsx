import { css, keyframes } from "@emotion/react";
import { useEffect, type ReactNode } from "react";
import { Icon } from "@guardian/stand/Icon";

interface Props {
    isOpen?: boolean;
    closeModal?: () => void;
    width?: number;
    top?: number;
    padding?: number;
    dialogBackgroundColor?: string;
    children: ReactNode;
}

const fadeIn = keyframes({
    from: { opacity: 0 },
    to: { opacity: 1 },
});

const frameStyle = {
    background: css({
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 1000,
        width: "100vw",
        height: "100vh",
        border: "none",
        padding: 0,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        animation: `${fadeIn} 500ms ease 250ms 1 both`,
    }),
    icon: css({
        color: "white",
    }),
    closeButton: css({
        position: "absolute",
        inset: 0,
        cursor: "pointer",
        height: "100%",
        width: "100%",
        boxSizing: "border-box",
        backgroundColor: "rgba(0, 0, 0, 0)",
        padding: 30,

        display: "flex",
        alignItems: "flex-start",
        justifyContent: "right",

        ":focus": {
            ".material-symbols": {
                outlineOffset: 3,
                outlineColor: "white",
                outlineStyle: "solid",
                outlineWidth: 2,
            },
        },
    }),
    dialog: (
        widthPercent = 60,
        top = 30,
        padding = 20,
        dialogBackgroundColor = "white",
    ) =>
        css({
            backgroundColor: dialogBackgroundColor,
            position: "absolute",
            height: "initial",
            width: `${widthPercent}%`,
            top: `${top}%`,
            right: `${(100 - widthPercent) / 2}%`,
            padding: padding,
        }),
};

const ModalFrame: React.FunctionComponent<Props> = ({
    children,
    closeModal,
    width,
    top,
    padding,
    dialogBackgroundColor,
    isOpen,
    ...rest
}) => {
    useEffect(() => {
        const closeOnEscape = (event: KeyboardEvent): void => {
            if (event.key === "Escape") {
                document.body.removeEventListener("keydown", closeOnEscape);
                closeModal?.();
            }
        };
        document.body.addEventListener("keydown", closeOnEscape, {
            capture: true,
            passive: true,
        });
        return () => {
            document.body.removeEventListener("keydown", closeOnEscape);
        };
    }, [closeModal]);

    if (!isOpen) {
        return null;
    }

    return (
        <div css={frameStyle.background} {...rest}>
            {closeModal && (
                <button
                    css={frameStyle.closeButton}
                    onClick={() => closeModal()}
                    aria-label="close modal"
                >
                    <Icon
                        symbol="x_circle"
                        size="lg"
                        cssOverrides={frameStyle.icon}
                    />
                </button>
            )}
            <div
                css={frameStyle.dialog(
                    width,
                    top,
                    padding,
                    dialogBackgroundColor,
                )}
            >
                {children}
            </div>
        </div>
    );
};

export { ModalFrame };
