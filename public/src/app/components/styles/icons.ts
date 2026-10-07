// Icons are imported with Vite's `?inline` query so they are embedded as
// `data:image/svg+xml` URIs in both dev and build (matching the previous
// webpack `asset/inline` behaviour), rather than served as separate URLs in dev.
import commentsOnIcon from '../../../../images/comment-green-14.svg?inline';
import commentsOffIcon from '../../../../images/comment-grey-14.svg?inline';
import legallySensitiveIcon from '../../../../images/legalcheck-grey-14.svg?inline';
import wrenchDisabledIcon from '../../lib/icons/svg/wrench-disabled.svg?inline';

export const icons = {
	legallySensitive: legallySensitiveIcon,
	commentsOn: commentsOnIcon,
	commentsOff: commentsOffIcon,
	wrenchDisabled: wrenchDisabledIcon,
} as const;
