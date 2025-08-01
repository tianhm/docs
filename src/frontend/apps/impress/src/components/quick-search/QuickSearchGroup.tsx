import { Command } from 'cmdk';
import { ReactNode } from 'react';

import { Box, Text } from '@/components';

import { QuickSearchData } from './QuickSearch';
import { QuickSearchItem } from './QuickSearchItem';

type Props<T> = {
  group: QuickSearchData<T>;
  renderElement?: (element: T) => ReactNode;
  onSelect?: (element: T) => void;
};

export const QuickSearchGroup = <T,>({
  group,
  onSelect,
  renderElement,
}: Props<T>) => {
  return (
    <Box $margin={{ top: 'sm' }}>
      <Command.Group
        key={group.groupName}
        heading={group.groupName}
        forceMount={false}
        contentEditable={false}
      >
        {group.startActions?.map((action, index) => {
          return (
            <QuickSearchItem
              key={`${group.groupName}-action-${index}`}
              onSelect={action.onSelect}
            >
              {action.content}
            </QuickSearchItem>
          );
        })}
        {group.elements.map((groupElement, index) => {
          return (
            <QuickSearchItem
              id={`${group.groupName}-element-${index}`}
              key={`${group.groupName}-element-${index}`}
              onSelect={() => {
                onSelect?.(groupElement);
              }}
            >
              {renderElement?.(groupElement)}
            </QuickSearchItem>
          );
        })}
        {group.endActions?.map((action, index) => {
          return (
            <QuickSearchItem
              key={`${group.groupName}-action-${index}`}
              onSelect={action.onSelect}
            >
              {action.content}
            </QuickSearchItem>
          );
        })}
        {group.emptyString && group.elements.length === 0 && (
          <Text
            $variation="500"
            $margin={{ left: '2xs', bottom: '3xs' }}
            $size="sm"
          >
            {group.emptyString}
          </Text>
        )}
      </Command.Group>
    </Box>
  );
};
