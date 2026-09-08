/** @jsxImportSource @emotion/react */
import type { FormEvent, FunctionComponent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { css, keyframes } from '@emotion/react';
import { Button } from '@guardian/stand/Button';
import { palette } from '../styles/palette';
import type { FormattedCreatedDate } from '../utils/dateFormat';
import {
	publishHiddenModal,
	subscribeCloseModal,
	subscribeDisplayModal,
	subscribeError,
} from '../utils/mediator';
import { useRestoreForm } from '../hooks/useRestoreForm';
import type { RestoreDestinationView } from '../hooks/useRestoreForm';

// Colours/fonts ported verbatim from the legacy modal SASS (modal.scss,
// text.scss, palette.scss). Only `grey400` maps to an existing local palette
// token; the rest are legacy values with no Stand/local equivalent so they are
// inlined here with comments.
const GREY_650 = '#333333'; // $color-650-grey (text)
const GREY_200 = '#EDEDED'; // $color-200-grey (disabled input background)
const INPUT_BORDER = '#9a9a9a';
const LOADING_BAR = '#898984'; // $color-500-grey
const FONT_EGYPTIAN = '"Guardian Egyptian Text"';
const FONT_AGATE = '"Guardian Agate Sans"';

// --- overlay (.modal + .center + .visually-hidden opacity toggle) ---
const overlay = (isActive: boolean) =>
	css({
		position: 'absolute',
		top: 0,
		left: 0,
		width: '100%',
		height: '100%',
		zIndex: 2,
		display: 'flex',
		justifyContent: 'center',
		alignItems: 'center',
		transition: 'opacity .2s ease-in',
		// `.visually-hidden` toggled the modal by opacity/pointer-events only, so
		// the e2e suite detects open/closed via computed opacity (1 vs 0).
		opacity: isActive ? 1 : 0,
		pointerEvents: isActive ? 'auto' : 'none',
		'&::before': {
			content: '" "',
			display: 'inline-block',
			position: 'absolute',
			top: 0,
			left: 0,
			width: '100%',
			height: '100%',
			background: 'black',
			opacity: 0.2,
			zIndex: 1,
		},
	});

// --- content box (gu-box variant="primary" + gu-box.modal__content override) ---
const box = css({
	position: 'relative',
	zIndex: 2,
	boxSizing: 'border-box',
	background: palette.boxPrimary,
	padding: '40px 30px 20px 30px',
	boxShadow: '15px 15px 30px rgba(0, 0, 0, 0.1)',
	width: '80%',
});

// --- sliding track (.modal-form + .modal__content__track + gu-row) ---
const modalForm = css({ minWidth: '400px', overflow: 'hidden' });
const track = css({ width: '200%' });
const rowCss = css({ display: 'flex', flexDirection: 'row', flexWrap: 'wrap' });

// Column widths from the 12-col grid mixin (col-#{span}).
const col = (width: string) =>
	css({ boxSizing: 'border-box', flex: `11 1 ${width}`, maxWidth: width });

const centre = css({
	display: 'flex',
	justifyContent: 'center',
	alignItems: 'center',
});

// .form-panel / .form-loading slide left when loading (.in-active).
const panel = (isLoading: boolean) =>
	css({
		boxSizing: 'border-box',
		flex: '11 1 50%',
		maxWidth: '50%',
		transform: isLoading ? 'translateX(-100%)' : 'translateX(0)',
		transition: 'transform .2s ease-in-out',
	});

// --- typography / blocks ---
const title = css({
	margin: 0,
	padding: 0,
	paddingBottom: '20px',
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
	// text.scss: .modal__content__form label { ... }
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

const actions = css({ flexDirection: 'row-reverse', gap: '10px' });

// --- loading bars (loading-bars.scss) ---
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

type RestoreModalProps = {
	/** Content id from the Angular route, bound via react2angular (see ../index.js). */
	contentId: string;
};

/**
 * Restore modal: the "Before you restore" confirmation form.
 *
 * Migrated from the `ModalCtrl`/`RestoreFormCtrl` block of restore-list.html.
 * Open/close is driven by the same `snapshot-list:*`/`error` mediator events the
 * legacy controllers used, so the (still-Angular) content panel, keyboard
 * handler and error modal keep working unchanged.
 */
const RestoreModal: FunctionComponent<RestoreModalProps> = ({ contentId }) => {
	const [isActive, setIsActive] = useState(false);
	const form = useRestoreForm(contentId, isActive);

	const closeModal = (): void => {
		document.body.style.height = '100%';
		document.body.style.overflow = 'visible';
		setIsActive(false);
		publishHiddenModal();
		form.reset();
	};

	// Latest values read by the once-registered mediator/keydown handlers.
	const closeRef = useRef(closeModal);
	closeRef.current = closeModal;
	const isActiveRef = useRef(isActive);
	isActiveRef.current = isActive;

	useEffect(() => {
		const open = (): void => {
			window.scroll(0, 0);
			// Lock the body so the page cannot scroll behind the modal.
			document.body.style.overflow = 'hidden';
			setIsActive(true);
		};

		const close = (): void => closeRef.current();

		const onKeyDown = (event: KeyboardEvent): void => {
			if (event.key === 'Escape' && isActiveRef.current) {
				close();
			}
		};

		const unsubscribeDisplay = subscribeDisplayModal(open);
		const unsubscribeClose = subscribeCloseModal(close);
		// Any error closes the modal, matching the legacy ModalController.
		const unsubscribeError = subscribeError(close);
		window.addEventListener('keydown', onKeyDown);

		return () => {
			unsubscribeDisplay();
			unsubscribeClose();
			unsubscribeError();
			window.removeEventListener('keydown', onKeyDown);
		};
	}, []);

	const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
		event.preventDefault();
		form.submit();
	};

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
		<div css={overlay(isActive)} data-testid="restore-modal">
			<div css={box}>
				<form noValidate css={modalForm} onSubmit={handleSubmit}>
					<div css={track}>
						<div css={rowCss}>
							<div css={panel(isLoading)}>
								<h1 css={title}>Before you restore</h1>

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
											<div css={[col('41.6667%'), centre]}>
												{sourceSummary && (
													<div
														css={source}
														data-testid="restore-source"
													>
														Snapshot of revision{' '}
														{sourceSummary.revisionId} taken{' '}
														<strong>
															{sourceSummary.isSecondary
																? 'from secondary'
																: ''}
														</strong>{' '}
														at{' '}
														<DateText
															date={sourceSummary.date}
														/>
													</div>
												)}
											</div>
											<div css={[col('8.3333%'), centre, arrow]}>
												{'\u2794'}
											</div>
											<div css={[col('50%'), centre]}>
												<div css={fullWidth}>
													<ol
														css={destinationList}
														data-testid="restore-destination-list"
													>
														{destinations.map(
															(destination, index) => {
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
										<h2 css={formHeader}>Make sure that:</h2>
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
															event.target.checked,
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
															event.target.checked,
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
													No one else is in the content
												</span>
											</label>
										</div>
									</div>
								</div>

								<div css={[rowCss, container(false), actions]}>
									<Button
										type="submit"
										variant="primary"
										size="sm"
										isDisabled={
											!selfInContent || !elseInContent
										}
									>
										Restore Version
									</Button>
									<Button
										type="button"
										variant="secondary"
										size="sm"
										onPress={closeModal}
									>
										Cancel
									</Button>
								</div>
							</div>

							<div css={panel(isLoading)}>
								<LoadingBars />
							</div>
						</div>
					</div>
				</form>
			</div>
		</div>
	);
};

export { RestoreModal };
export type { RestoreModalProps };
