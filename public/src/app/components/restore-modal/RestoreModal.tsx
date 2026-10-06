/** @jsxImportSource @emotion/react */
import { css, keyframes } from '@emotion/react';
import { Button } from '@guardian/stand/Button';
import { Dialog, Modal } from '@guardian/stand/Modal';
import type { FunctionComponent } from 'react';
import { useEffect } from 'react';
import { useRestoreForm } from '../hooks/useRestoreForm';
import type { RestoreDestinationView } from '../hooks/useRestoreForm';
import { useAppDispatch, useIsModalOpen } from '../store/hooks';
import { closeModal as closeModalAction } from '../store/viewerSlice';
import { palette } from '../styles/palette';
import type { FormattedCreatedDate } from '../utils/dateFormat';

// Colours and fonts preserve the legacy modal presentation. Only `grey400`
// maps to an existing local palette
// token; the rest are legacy values with no Stand/local equivalent so they are
// inlined here with comments.
const GREY_650 = '#333333'; // $color-650-grey (text)
const GREY_200 = '#EDEDED'; // $color-200-grey (disabled input background)
const INPUT_BORDER = '#9a9a9a';
const LOADING_BAR = '#898984'; // $color-500-grey
const FONT_EGYPTIAN = '"Guardian Egyptian Text"';
const FONT_AGATE = '"Guardian Agate Sans"';

// Mirror the legacy box presentation on the Stand Modal: an 80%-wide, square,
// white panel over a 20%-black backdrop.
const modalTheme = {
	overlay: {
		backgroundColor: 'rgba(0, 0, 0, 0.2)',
	},
	modal: {
		width: '80%',
		maxWidth: 'none',
		backgroundColor: palette.boxPrimary,
		boxShadow: '15px 15px 30px rgba(0, 0, 0, 0.1)',
		borderRadius: '0',
		padding: {
			top: '40px',
			bottom: '20px',
			left: '30px',
			right: '30px',
		},
	},
};

const modalCss = css({ boxSizing: 'border-box' });
const dialogCss = css({ outline: 'none' });
const contentBody = css({ minWidth: '400px' });
const buttonsCss = css({ paddingTop: '20px' });

const rowCss = css({ display: 'flex', flexDirection: 'row', flexWrap: 'wrap' });

// Column widths from the 12-col grid mixin (col-#{span}).
const col = (width: string) =>
	css({ boxSizing: 'border-box', flex: `11 1 ${width}`, maxWidth: width });

const centre = css({
	display: 'flex',
	justifyContent: 'center',
	alignItems: 'center',
});

// --- typography / blocks ---
// Applied to the Stand Dialog header to keep the legacy title face.
const titleCss = css({
	margin: 0,
	padding: 0,
	fontFamily: FONT_EGYPTIAN,
	fontSize: '24px',
	fontWeight: 'bold',
	color: GREY_650,
});

const formHeader = css({
	marginTop: 0,
	marginBottom: '10px',
	fontFamily: FONT_EGYPTIAN,
	fontSize: '14px',
	fontWeight: 'bold',
	color: GREY_650,
});

// .modal__content__container — bottom rule between sections (none on the last).
const container = (hasBorder: boolean) =>
	css({
		padding: '20px 0',
		borderBottom: hasBorder ? `1px solid ${palette.grey400}` : 'none',
	});

const source = css({
	border: `1px solid ${palette.grey400}`,
	padding: '8px',
	fontFamily: FONT_AGATE,
	fontSize: '16px',
});

const arrow = css({ fontSize: 'xx-large' });

const fullWidth = css({ width: '100%' });

// --- destination list (.modal__content__destination-list + -form) ---
const destinationList = css({
	marginTop: '5px',
	marginBottom: 0,
	paddingLeft: 0,
	fontFamily: FONT_AGATE,
	fontSize: '16px',
});

const destinationItem = (isLast: boolean) =>
	css({
		listStyle: 'none',
		width: '100%',
		border: `1px solid ${palette.grey400}`,
		boxSizing: 'border-box',
		padding: '8px',
		marginBottom: isLast ? 0 : '10px',
	});

const destinationLabel = css({
	position: 'relative',
	display: 'flex',
	alignItems: 'center',
});

// --- form fieldsets (.modal__content__form) ---
const formColumn = css({
	// Form labels use the Egyptian display face.
	label: {
		fontFamily: FONT_EGYPTIAN,
		fontSize: '14px',
		lineHeight: 0.1,
		color: GREY_650,
	},
});

const fieldset = (isLast: boolean) =>
	css({ marginBottom: isLast ? 0 : '10px' });

const checkboxLabel = css({ position: 'relative' });

const labelText = css({ position: 'relative', top: '-5px' });

// Custom-styled radio/checkbox: the native control is reset and a decorative
// green check (the legacy `.checked-decal`) is shown when selected. Kept as raw
// inputs (rather than Stand's Checkbox/RadioGroup) because the e2e suite matches
// these controls by an accessible name that includes the "✓" decal, and the
// custom checked/disabled visuals have no direct Stand equivalent.
const controlInput = css({
	appearance: 'none',
	WebkitAppearance: 'none',
	MozAppearance: 'none',
	width: '20px',
	height: '20px',
	flexShrink: 0,
	marginRight: '10px',
	border: `1px solid ${INPUT_BORDER}`,
	'&:focus': { outline: 0 },
	'&:disabled': { background: GREY_200 },
});

// The decal keeps its "✓" content in the accessibility tree even when hidden
// (opacity toggle only), matching the legacy markup the e2e locators rely on.
const decal = (isChecked: boolean, top?: string) =>
	css({
		pointerEvents: 'none',
		position: 'absolute',
		left: '5px',
		top,
		fontSize: '22px',
		color: 'green',
		opacity: isChecked ? 1 : 0,
		transition: 'opacity .2s ease-in-out',
		'&::before': { content: '"\\2713"' },
	});

// --- loading bars ---
const stretchdelay = keyframes({
	'0%, 40%, 100%': { transform: 'scaleY(0.4)' },
	'20%': { transform: 'scaleY(1.0)' },
});

const loadingBars = css({
	margin: '100px auto',
	width: '50px',
	height: '30px',
	textAlign: 'center',
	fontSize: '10px',
});

const loadingBar = (delay: string) =>
	css({
		backgroundColor: LOADING_BAR,
		height: '100%',
		width: '6px',
		display: 'inline-block',
		animation: `${stretchdelay} 1.2s infinite ease-in-out`,
		animationDelay: delay,
	});

const LoadingBars: FunctionComponent = () => (
	<div css={loadingBars}>
		<div css={loadingBar('0s')} />
		<div css={loadingBar('-1.1s')} />
		<div css={loadingBar('-1.0s')} />
		<div css={loadingBar('-0.9s')} />
		<div css={loadingBar('-0.8s')} />
	</div>
);

/** Render a snapshot/last-modified date with a superscript ordinal (DateFormatService.formatHtml). */
const DateText: FunctionComponent<{ date: FormattedCreatedDate }> = ({
	date,
}) => (
	<>
		{date.prefix}
		<sup>{date.ordinal}</sup> {date.month}
	</>
);

/** The per-destination change summary (ported from `RestoreFormCtrl`'s changeString). */
const DestinationChangeText: FunctionComponent<{
	change: RestoreDestinationView['change'];
}> = ({ change }) => {
	switch (change.kind) {
		case 'revision':
			return (
				<em>
					currently has revision {change.revisionId}, last modified at{' '}
					<DateText date={change.date} />
				</em>
			);
		case 'not-on-instance':
			return <em>content not on this instance</em>;
		case 'none':
			return null;
	}
};

export type RestoreModalProps = {
	/** Content id parsed from the application route. */
	contentId: string;
};

/**
 * Restore modal: the "Before you restore" confirmation form.
 *
 * Migrated from the `ModalCtrl`/`RestoreFormCtrl` block of restore-list.html.
 * Open/close is driven by the Redux viewer slice (`isModalOpen`), shared with the
 * content viewer, sidebar keyboard handler and error modal. The shell is the
 * Stand `Modal`/`Dialog`, which owns focus trapping, the body scroll lock and
 * Escape-to-close.
 */
export const RestoreModal: FunctionComponent<RestoreModalProps> = ({
	contentId,
}) => {
	const dispatch = useAppDispatch();
	const isActive = useIsModalOpen();
	const form = useRestoreForm(contentId, isActive);
	const { reset } = form;

	// Reset the form each time the modal closes.
	useEffect(() => {
		if (!isActive) {
			reset();
		}
	}, [isActive, reset]);

	const {
		isLoading,
		source: sourceSummary,
		destinations,
		selectedSystemId,
		setSelectedSystemId,
		selfInContent,
		setSelfInContent,
		elseInContent,
		setElseInContent,
	} = form;

	return (
		<Modal
			isOpen={isActive}
			onOpenChange={(open) => {
				if (!open) {
					dispatch(closeModalAction());
				}
			}}
			data-testid="restore-modal"
			theme={modalTheme}
			cssOverrides={modalCss}
		>
			<Dialog aria-label="Before you restore" cssOverrides={dialogCss}>
				{isLoading ? (
					<Dialog.Content theme={{ marginBottom: '0' }}>
						<LoadingBars />
					</Dialog.Content>
				) : (
					// Passed as an array (not a fragment) because Stand's Dialog
					// filters its children by component type and does not descend
					// into fragments.
					[
						<Dialog.Header
							key="header"
							element="h1"
							theme={{ marginBottom: '20px' }}
							cssOverrides={titleCss}
						>
							Before you restore
						</Dialog.Header>,
						<Dialog.Content
							key="content"
							theme={{ marginBottom: '0' }}
						>
							<div css={contentBody}>
								<div css={[rowCss, container(true)]}>
									<div css={col('100%')}>
										<div css={rowCss}>
											<div css={col('50%')}>
												<h2 css={formHeader}>From:</h2>
											</div>
											<div css={col('50%')}>
												<h2 css={formHeader}>To:</h2>
											</div>
										</div>
										<div css={rowCss}>
											<div
												css={[col('41.6667%'), centre]}
											>
												{sourceSummary && (
													<div
														css={source}
														data-testid="restore-source"
													>
														Snapshot of revision{' '}
														{
															sourceSummary.revisionId
														}{' '}
														taken{' '}
														<strong>
															{sourceSummary.isSecondary
																? 'from secondary'
																: ''}
														</strong>{' '}
														at{' '}
														<DateText
															date={
																sourceSummary.date
															}
														/>
													</div>
												)}
											</div>
											<div
												css={[
													col('8.3333%'),
													centre,
													arrow,
												]}
											>
												{'\u2794'}
											</div>
											<div css={[col('50%'), centre]}>
												<div css={fullWidth}>
													<ol
														css={destinationList}
														data-testid="restore-destination-list"
													>
														{destinations.map(
															(
																destination,
																index,
															) => {
																const isChecked =
																	selectedSystemId ===
																	destination.systemId;
																return (
																	<li
																		key={
																			destination.systemId
																		}
																		css={destinationItem(
																			index ===
																				destinations.length -
																					1,
																		)}
																		data-testid="restore-destination-item"
																	>
																		<label
																			css={
																				destinationLabel
																			}
																			htmlFor={
																				destination.systemId
																			}
																		>
																			<input
																				css={
																					controlInput
																				}
																				type="radio"
																				id={
																					destination.systemId
																				}
																				name="destination"
																				value={
																					destination.systemId
																				}
																				disabled={
																					!destination.available
																				}
																				checked={
																					isChecked
																				}
																				onChange={() =>
																					setSelectedSystemId(
																						destination.systemId,
																					)
																				}
																			/>
																			<span
																				css={decal(
																					isChecked,
																				)}
																			/>
																			<span>
																				{
																					destination.displayName
																				}{' '}
																				<DestinationChangeText
																					change={
																						destination.change
																					}
																				/>
																			</span>
																		</label>
																	</li>
																);
															},
														)}
													</ol>
												</div>
											</div>
										</div>
									</div>
								</div>

								<div css={[rowCss, container(true)]}>
									<div css={[col('100%'), formColumn]}>
										<h2 css={formHeader}>
											Make sure that:
										</h2>
										<div css={[rowCss, fieldset(false)]}>
											<label
												css={checkboxLabel}
												htmlFor="self-in-content"
											>
												<input
													css={controlInput}
													type="checkbox"
													id="self-in-content"
													name="selfInContent"
													checked={selfInContent}
													onChange={(event) =>
														setSelfInContent(
															event.target
																.checked,
														)
													}
												/>
												<span
													css={decal(
														selfInContent,
														'14px',
													)}
												/>
												<span css={labelText}>
													You are not in content
												</span>
											</label>
										</div>
										<div css={[rowCss, fieldset(true)]}>
											<label
												css={checkboxLabel}
												htmlFor="else-in-content"
											>
												<input
													css={controlInput}
													type="checkbox"
													id="else-in-content"
													name="elseInContent"
													checked={elseInContent}
													onChange={(event) =>
														setElseInContent(
															event.target
																.checked,
														)
													}
												/>
												<span
													css={decal(
														elseInContent,
														'14px',
													)}
												/>
												<span css={labelText}>
													No one else is in the
													content
												</span>
											</label>
										</div>
									</div>
								</div>
							</div>
						</Dialog.Content>,
						<Dialog.Buttons key="buttons" cssOverrides={buttonsCss}>
							<Button
								type="button"
								variant="secondary"
								size="sm"
								onPress={() => dispatch(closeModalAction())}
							>
								Cancel
							</Button>
							<Button
								type="button"
								variant="primary"
								size="sm"
								isDisabled={!selfInContent || !elseInContent}
								onPress={() => form.submit()}
							>
								Restore Version
							</Button>
						</Dialog.Buttons>,
					]
				)}
			</Dialog>
		</Modal>
	);
};
