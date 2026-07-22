import { css } from "@emotion/react";
import { semanticColors, semanticSizing } from "@guardian/stand";
import { Button } from "@guardian/stand/Button";
import { Checkbox, CheckboxGroup } from "@guardian/stand/Checkbox";
import { Grid, Item } from "@guardian/stand/Grid";
import { Icon } from "@guardian/stand/Icon";
import { Typography } from "@guardian/stand/Typography";
import { useEffect, useState } from "react";
import { SnapshotIdModel, type VersionListItem } from "../models";
import { ModalFrame } from "./ModalFrame";

interface Props {
    close: { (): void };
    isOpen: boolean;
    item?: VersionListItem;
    requestRestore: { (): void };
}

const styles = {
    buttonRow: css({
        display: "flex",
        gap: 10,
        justifyContent: "flex-end",
        paddingTop: 20,
        borderTopColor: semanticColors.border.weak,
        borderTopWidth: 1,
        borderTopStyle: "solid",
        marginTop: 20,
    }),
    checkboxRow: css({
        gap: 10,
        paddingTop: 20,
        borderTopColor: semanticColors.border.weak,
        borderTopWidth: 1,
        borderTopStyle: "solid",
        marginTop: 20,
    }),
    box: css({
        borderColor: semanticColors.border.weak,
        border: semanticSizing.border.default,
        borderStyle: "solid",
        padding: 5,
        marginBottom: 10,
        display: "flex",
        alignItems: "center",
        gap: 5,
    }),
    topRowItem: css({
        marginBottom: 10,
    }),
};

const gridTheme = {
    sm: { padding: "0" },
    md: { padding: "0" },
    lg: { padding: "0" },
    shared: {
        alignItems: "center",
    },
};

export const ConfirmRestoreModal = ({
    close,
    isOpen,
    item,
    requestRestore,
}: Props) => {
    const [selected, setSelected] = useState<string[]>([]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- will not cascade
        setSelected([]);
    }, [isOpen]);

    const itemModel = item && new SnapshotIdModel(item);

    return (
        <ModalFrame isOpen={isOpen} closeModal={close}>
            <Typography variant="titleLg">Before you restore</Typography>

            {itemModel && (
                <>
                    <Grid theme={gridTheme}>
                        <Item size={6} cssOverrides={css(styles.topRowItem)}>
                            <Typography element="div" variant="headingSm">
                                From:
                            </Typography>
                        </Item>
                        <Item
                            size={1}
                            cssOverrides={css(styles.topRowItem)}
                        ></Item>
                        <Item size={5} cssOverrides={css(styles.topRowItem)}>
                            <Typography element="div" variant="headingSm">
                                To:
                            </Typography>
                        </Item>
                    </Grid>
                    <Grid theme={gridTheme}>
                        <Item size={6}>
                            <div css={styles.box}>
                                <Typography>
                                    Snapshot of revision {itemModel.revisionId}{" "}
                                    taken at{" "}
                                    {itemModel.createdDate.format(
                                        "HH:mm:ss on DD MM YYYY",
                                    )}
                                </Typography>
                            </div>
                        </Item>
                        <Item
                            size={1}
                            cssOverrides={css({
                                display: "flex",
                                justifyContent: "center",
                            })}
                        >
                            <Icon symbol="arrow_forward" size={"lg"} />
                        </Item>
                        <Item size={5}>
                            <div css={styles.box}>
                                <Icon symbol="check_box" />
                                <Typography>some destination</Typography>
                            </div>
                            <div css={styles.box}>
                                <Icon symbol="check_box_outline_blank" />
                                <Typography>some destination</Typography>
                            </div>
                        </Item>
                    </Grid>
                </>
            )}

            <div css={styles.checkboxRow}>
                <CheckboxGroup
                    label="Make Sure That"
                    value={selected}
                    onChange={setSelected}
                >
                    <Checkbox value="youAreNotIn">
                        You are not in content
                    </Checkbox>
                    <Checkbox value="noOneElseIsIn">
                        No one else is in the content
                    </Checkbox>
                </CheckboxGroup>
            </div>
            <div css={styles.buttonRow}>
                <Button onClick={close}>Cancel</Button>
                <Button
                    icon="build"
                    onClick={requestRestore}
                    isDisabled={selected.length < 2}
                >
                    Restore
                </Button>
            </div>
        </ModalFrame>
    );
};
