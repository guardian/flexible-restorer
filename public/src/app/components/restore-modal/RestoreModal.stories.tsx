import { mockContentId } from '#.storybook/mockData';
import preview from '#.storybook/preview';
import { RestoreModal } from './RestoreModal';

const meta = preview.meta({
	component: RestoreModal,
	args: { contentId: mockContentId },
	parameters: { viewer: { isModalOpen: true } },
});

export const Default = meta.story();
