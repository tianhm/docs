import { Box, Icon } from '@/components';
import { QuickSearchItemContent } from '@/components/quick-search/';
import { Doc, SimpleDocItem } from '@/docs/doc-management';
import { useResponsiveStore } from '@/stores';

type DocSearchItemProps = {
  doc: Doc;
};

export const DocSearchItem = ({ doc }: DocSearchItemProps) => {
  const { isDesktop } = useResponsiveStore();
  return (
    <Box
      data-testid={`doc-search-item-${doc.id}`}
      $width="100%"
      className="--docs--doc-search-item"
    >
      <QuickSearchItemContent
        left={
          <Box $direction="row" $align="center" $gap="10px" $width="100%">
            <Box $flex={isDesktop ? 9 : 1}>
              <SimpleDocItem doc={doc} showAccesses />
            </Box>
          </Box>
        }
        right={
          <Icon iconName="keyboard_return" $theme="primary" $variation="800" />
        }
      />
    </Box>
  );
};
