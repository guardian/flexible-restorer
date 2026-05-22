import { Layout } from "@guardian/stand/Layout";
import React, { useState } from "react";
import { GuBtn, GuColumn, GuIcon, GuRow } from "./GuComponents";
import Dayjs from "dayjs";

/*
initial file generated with AI:
Read the Angular template in restore-list.html and convert it to a react component, to be outputted in RestoreList.tsx. For the elements with custom names starting with "gu-", create supporting react components, for example "<gu-column>" becomes "<GuColoumn>". Infer what you can about how the supporting components should behave based on the files imported from gu-components.js

(follow up)
just split the component to a separate files, do not worry about unit tests for them

*/

export type VersionModel = {
    isSecondary?: boolean;
    activeState?: boolean;
    revisionId?: number | string;
    createdDateHtml?: string;
    createdTimestamp?: string;
    relativeDate?: string;
    userEmail?: string;
    snapshotReason?: string;
    isLegallySensitive?: boolean;
    commentsEnabled?: { on?: boolean; defined?: boolean };
    publishedState?: string;
    isBecauseOfLaunch?: boolean;
};

type Props = {
    models?: VersionModel[];
    articleTitle?: string;
    articleURL?: string;
    articleHash?: string;
    canRestore?: boolean;
    copyButtonLabel?: string;
    displayButtonLabel?: string;
    headline?: string;
    standfirst?: string;
    trailText?: string;
    htmlContent?: string;
    jsonContent?: string;
    contentId?: string | number;
};

// Main converted component
export const RestoreList: React.FC<Props> = ({
    models = [],
    articleTitle = "",
    articleURL = "#",
    articleHash = "",
    canRestore = false,
    copyButtonLabel = "Copy",
    displayButtonLabel = "Display JSON",
    headline = "",
    standfirst = "",
    trailText = "",
    htmlContent = "",
    jsonContent = "",
    contentId = "",
}) => {
    const [today] = useState(() => new Date().toISOString());

    const getRelativeDate = (model: VersionModel, nextModel?: VersionModel) => {
        const nextModelTime = nextModel?.createdTimestamp ?? today;
        const newModelTime = model.createdTimestamp;

        if (!newModelTime) {
            return `[no relative date]`;
        }

        const hourDiff = Dayjs(nextModelTime).diff(newModelTime, "hours");
        if (hourDiff < 36) {
            return `${hourDiff} hours ago`;
        }
        const dayDiff = Dayjs(nextModelTime).diff(newModelTime, "days");
        return `${dayDiff} days ago`;
    };

    return (
        <>
            <Layout.Sidebar>
                <div className="scrollable__container">
                    <div className="scrollable__header-fixed">
                        <h1 className="article-headline">{articleTitle}</h1>
                        <h6 className="article-hash">
                            (
                            <a
                                href={articleURL}
                                target="_blank"
                                rel="noreferrer"
                            >
                                {articleHash}
                            </a>
                            )
                        </h6>
                        <GuRow className="snapshot-list-header">
                            <span
                                className="snapshot-list-header__decal"
                                title="Content revision number"
                            >
                                No.
                            </span>
                            <span className="snapshot-list-header__content">
                                Snapped at &amp; last modified
                            </span>
                            <span className="snapshot-list-header__status">
                                Status
                            </span>
                        </GuRow>
                    </div>

                    <div className="scrollable__body">
                        <ol className="index-list snapshot-list">
                            {models.map((model, index) => (
                                <React.Fragment key={index}>
                                    {model.isSecondary && (
                                        <li className="snapshot-list-secondary">
                                            Snapshot from secondary
                                        </li>
                                    )}

                                    <li
                                        className={`snapshot-list__item index-list__item index-list__item--${model.activeState ? "tertiary" : "primary"}`}
                                        data-variant={
                                            model.activeState
                                                ? "tertiary"
                                                : "primary"
                                        }
                                    >
                                        <div className="index-list__item__index">
                                            {model.revisionId ??
                                                models.length - index}
                                        </div>

                                        <div
                                            className={`snapshot-list__item__content ${model.activeState ? "active" : ""}`}
                                        >
                                            <h6
                                                className="snapshot-list__item__content__actual-date"
                                                dangerouslySetInnerHTML={{
                                                    __html:
                                                        model.createdDateHtml ??
                                                        "",
                                                }}
                                            ></h6>
                                            <h6 className="snapshot-list__item__content__relative-date">
                                                {/* {model.relativeDate} ago */}
                                                {getRelativeDate(model)}
                                            </h6>
                                            <h6 className="snapshot-list__item__content__reason">
                                                Last modified by:{" "}
                                                {model.userEmail}
                                            </h6>
                                            <h6 className="snapshot-list__item__content__reason">
                                                {model.snapshotReason}
                                            </h6>
                                        </div>

                                        <div className="snapshot-list__item__information">
                                            <div className="snapshot-list__item__status">
                                                <div className="snapshot-list__item__status--left">
                                                    {model.isLegallySensitive && (
                                                        <div className="snapshot-list__item__settings__legally-sensitive" />
                                                    )}

                                                    {model.commentsEnabled
                                                        ?.on && (
                                                        <div className="snapshot-list__item__settings__comments--on">
                                                            <div className="snapshot-list__item__settings__comments--on-image" />
                                                            <div className="snapshot-list__item__settings__content--text">
                                                                on
                                                            </div>
                                                        </div>
                                                    )}

                                                    {model.commentsEnabled
                                                        ?.defined &&
                                                        !model.commentsEnabled
                                                            ?.on && (
                                                            <div className="snapshot-list__item__settings__comments--off">
                                                                <div className="snapshot-list__item__settings__comments--off-image" />
                                                                <div className="snapshot-list__item__settings__content--text">
                                                                    off
                                                                </div>
                                                            </div>
                                                        )}
                                                </div>

                                                {model.publishedState && (
                                                    <div className="snapshot-list__item__status--right">
                                                        {model.publishedState}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </li>

                                    <li className="delta-row">
                                        <GuRow variant="reverse">
                                            <GuIcon
                                                className="delta-row__icon"
                                                variant="expand-disabled"
                                            />
                                            <span className="delta-row__content">
                                                {/* AI got this wrong - should be the date relative to the next item */}
                                                {/* {model.relativeDate} */}
                                                {getRelativeDate(
                                                    model,
                                                    models[index + 1],
                                                )}
                                            </span>
                                        </GuRow>
                                    </li>
                                </React.Fragment>
                            ))}
                        </ol>
                    </div>
                </div>
            </Layout.Sidebar>

            <Layout.Main>
                <div className="snapshot-content__viewport scrollable__container">
                    <GuRow className="snapshot-content__actions scrollable__header-fixed">
                        {canRestore && (
                            <GuBtn className="snapshot-content__actions--button">
                                <GuIcon
                                    className="snapshot-content__actions__restore__icon"
                                    variant="wrench-disabled"
                                />
                                <span>Restore</span>
                            </GuBtn>
                        )}
                        <GuBtn className="snapshot-content__actions--button">
                            {copyButtonLabel}
                        </GuBtn>
                        <a
                            className="snapshot-content__actions--button btn btn"
                            target="_blank"
                            rel="noreferrer"
                            href={`/export/${contentId}/git`}
                        >
                            Export all as Git Repo
                        </a>
                        <a
                            className="snapshot-content__actions--button btn btn"
                            target="_blank"
                            rel="noreferrer"
                            href={`/export/${contentId}/zip`}
                        >
                            Export all as Zip
                        </a>
                        <GuBtn className="snapshot-content__actions--button">
                            {displayButtonLabel}
                        </GuBtn>
                    </GuRow>

                    <div className="scrollable__body">
                        <div className="snapshot-content__furniture">
                            <GuRow className="snapshot-content__furniture__item">
                                <h4 className="snapshot-content__furniture__item--header">
                                    Headline
                                </h4>
                                <p className="snapshot-content__furniture__item--content">
                                    {headline}
                                </p>
                            </GuRow>

                            <GuRow className="snapshot-content__furniture__item">
                                <h4 className="snapshot-content__furniture__item--header">
                                    Standfirst
                                </h4>
                                <p className="snapshot-content__furniture__item--content">
                                    {standfirst}
                                </p>
                            </GuRow>

                            <GuRow className="snapshot-content__furniture__item">
                                <h4 className="snapshot-content__furniture__item--header">
                                    TrailText
                                </h4>
                                <p className="snapshot-content__furniture__item--content">
                                    {trailText}
                                </p>
                            </GuRow>
                        </div>

                        <GuRow className={`snapshot-content__container`}>
                            <GuColumn
                                span={6}
                                className="snapshot-content__container__item"
                            >
                                <div
                                    dangerouslySetInnerHTML={{
                                        __html: htmlContent,
                                    }}
                                />
                            </GuColumn>

                            <GuColumn
                                span={6}
                                className="snapshot-content__container__item--json"
                            >
                                <pre>
                                    <code>{jsonContent}</code>
                                </pre>
                            </GuColumn>
                        </GuRow>
                    </div>
                </div>
            </Layout.Main>
        </>
    );
};
