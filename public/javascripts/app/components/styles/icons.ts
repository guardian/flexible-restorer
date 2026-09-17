// Icons are imported so webpack's `asset/inline` loader embeds them as
// `data:image/svg+xml` URIs (matching the previous inlined-icon behaviour).
import legallySensitiveIcon from '../../../../images/legalcheck-grey-14.svg';
import commentsOnIcon from '../../../../images/comment-green-14.svg';
import commentsOffIcon from '../../../../images/comment-grey-14.svg';
import wrenchDisabledIcon from '../../lib/icons/svg/wrench-disabled.svg';

export const icons = {
	legallySensitive: legallySensitiveIcon,
	commentsOn: commentsOnIcon,
	commentsOff: commentsOffIcon,
	wrenchDisabled: wrenchDisabledIcon,
} as const;
