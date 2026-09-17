import type { FunctionComponent } from 'react';
import { css } from '@emotion/react';
import { Dialog, Modal } from '@guardian/stand/Modal';
import { selectError, useAppSelector } from '../store/hooks';

const modalTheme = {
	overlay: {
		backgroundColor: 'rgba(0, 0, 0, 0.2)',
	},
	modal: {
		width: '80%',
		maxWidth: 'none',
		boxShadow: '15px 15px 30px rgba(0, 0, 0, 0.1)',
		borderRadius: '0',
		padding: {
			top: '20px',
			bottom: '30px',
			left: '30px',
			right: '30px',
		},
	},
};

const modalCss = css({ boxSizing: 'border-box' });
const dialogCss = css({ outline: 'none' });
const titleCss = css({
	fontFamily: '"Guardian Egyptian Text"',
	fontSize: '24px',
	fontWeight: 'bold',
	lineHeight: 'normal',
	letterSpacing: 0,
	color: '#333333',
});
const contentCss = css({
	fontFamily: 'inherit',
	fontSize: 'inherit',
	fontWeight: 'inherit',
	lineHeight: 'normal',
});

/** Displays application errors held in the Redux viewer slice. */
const ErrorModal: FunctionComponent = () => {
	const errorMessage = useAppSelector(selectError);

	return (
		<Modal
			isOpen={errorMessage !== null}
			data-testid="error-modal"
			theme={modalTheme}
			cssOverrides={modalCss}
		>
			<Dialog cssOverrides={dialogCss}>
				<Dialog.Header
					theme={{ marginBottom: '20px' }}
					cssOverrides={titleCss}
				>
					Ooops, something went wrong
				</Dialog.Header>
				<Dialog.Content
					theme={{ marginBottom: '0' }}
					cssOverrides={contentCss}
				>
					{errorMessage}
				</Dialog.Content>
			</Dialog>
		</Modal>
	);
};

export { ErrorModal };